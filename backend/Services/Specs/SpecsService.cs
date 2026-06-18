using Adashop.Data;
using Adashop.DTOs;
using Adashop.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Adashop.Services.Specs;

public interface ISpecsService
{
    Task<ProductSpecResponse?> GetSpecsByProductId(int productId);
    Task<ProductSpecResponse> UpdateSpecsManually(int productId, UpdateProductSpecRequest request);
    Task<ProductSpecResponse?> FetchFromIcecat(int productId);
}

public class SpecsService : ISpecsService
{
    private readonly DataContext _db;
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SpecsService> _log;

    public SpecsService(DataContext db, HttpClient http, IConfiguration config, ILogger<SpecsService> log)
    {
        _db = db;
        _http = http;
        _config = config;
        _log = log;
    }

    public async Task<ProductSpecResponse?> GetSpecsByProductId(int productId)
    {
        var spec = await _db.ProductSpecs
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ProductId == productId);

        return spec == null ? null : MapToResponse(spec);
    }

    public async Task<ProductSpecResponse> UpdateSpecsManually(int productId, UpdateProductSpecRequest request)
    {
        var spec = await _db.ProductSpecs.FirstOrDefaultAsync(s => s.ProductId == productId);

        if (spec == null)
        {
            spec = new ProductSpec { ProductId = productId };
            _db.ProductSpecs.Add(spec);
        }

        spec.Brand           = request.Brand           ?? spec.Brand;
        spec.Model           = request.Model           ?? spec.Model;
        spec.DisplaySize     = request.DisplaySize     ?? spec.DisplaySize;
        spec.DisplayType     = request.DisplayType     ?? spec.DisplayType;
        spec.DisplayResolution = request.DisplayResolution ?? spec.DisplayResolution;
        spec.RefreshRate     = request.RefreshRate     ?? spec.RefreshRate;
        spec.Processor       = request.Processor       ?? spec.Processor;
        spec.RAM             = request.RAM             ?? spec.RAM;
        spec.Storage         = request.Storage         ?? spec.Storage;
        spec.GPU             = request.GPU             ?? spec.GPU;
        spec.OperatingSystem = request.OperatingSystem ?? spec.OperatingSystem;
        spec.MainCamera      = request.MainCamera      ?? spec.MainCamera;
        spec.FrontCamera     = request.FrontCamera     ?? spec.FrontCamera;
        spec.BatteryCapacity = request.BatteryCapacity ?? spec.BatteryCapacity;
        spec.ChargingSpeed   = request.ChargingSpeed   ?? spec.ChargingSpeed;
        spec.Connectivity    = request.Connectivity    ?? spec.Connectivity;
        spec.Ports           = request.Ports           ?? spec.Ports;
        spec.Weight          = request.Weight          ?? spec.Weight;
        spec.Dimensions      = request.Dimensions      ?? spec.Dimensions;
        spec.Color           = request.Color           ?? spec.Color;
        spec.VRAM            = request.VRAM            ?? spec.VRAM;
        spec.Cores           = request.Cores           ?? spec.Cores;
        spec.ClockSpeed      = request.ClockSpeed      ?? spec.ClockSpeed;
        spec.TDP             = request.TDP             ?? spec.TDP;
        spec.MemoryType      = request.MemoryType      ?? spec.MemoryType;
        spec.MemorySpeed     = request.MemorySpeed     ?? spec.MemorySpeed;
        spec.FormFactor      = request.FormFactor      ?? spec.FormFactor;
        spec.Socket          = request.Socket          ?? spec.Socket;
        spec.SpecSource      = "Manual";
        spec.LastFetchedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(spec);
    }

    public async Task<ProductSpecResponse?> FetchFromIcecat(int productId)
    {
        try
        {
            var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId);
            if (product == null) return null;

            var (brand, model) = ExtractBrandAndModel(product.Name);

            var username = _config["Icecat:Username"] ?? "";
            var language = "en";

            var url = $"https://icecat.us/api/equal.php4?UserName={username}&lang={language}&Brand={Uri.EscapeDataString(brand)}&ProductName={Uri.EscapeDataString(model)}&Output=JSON";

            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Add("User-Agent", "VoltStore/1.0");

            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);

            // Parse specs AND image from Icecat response
            var (spec, imageUrl) = await ParseIcecatResponse(json, productId, brand, model);
            if (spec == null) return null;

            // Save specs
            var existing = await _db.ProductSpecs.FirstOrDefaultAsync(s => s.ProductId == productId);
            if (existing != null)
            {
                _db.ProductSpecs.Remove(existing);
                await _db.SaveChangesAsync();
            }
            _db.ProductSpecs.Add(spec);
            await _db.SaveChangesAsync();

            // Save image if Icecat returned one
            if (!string.IsNullOrEmpty(imageUrl))
            {
                await SaveProductImage(productId, imageUrl);
                _log.LogInformation("Saved Icecat image for product {ProductId}: {ImageUrl}", productId, imageUrl);
            }

            _log.LogInformation("Fetched specs from Icecat for product {ProductId}: {Brand} {Model}", productId, brand, model);
            return MapToResponse(spec);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Failed to fetch specs from Icecat for product {ProductId}", productId);
            return await CreateFallbackSpecs(productId);
        }
    }

    // ── Save image to ProductImages table ────────────────────────────────────
    private async Task SaveProductImage(int productId, string imageUrl)
    {
        // Remove existing main image
        var existingImages = await _db.ProductImages
            .Where(i => i.ProductId == productId && i.IsMain)
            .ToListAsync();

        if (existingImages.Any())
        {
            _db.ProductImages.RemoveRange(existingImages);
            await _db.SaveChangesAsync();
        }

        // Add new main image from Icecat
        _db.ProductImages.Add(new ProductImage
        {
            ProductId = productId,
            ImageUrl  = imageUrl,
            IsMain    = true,
            SortOrder = 1
        });

        await _db.SaveChangesAsync();
    }

    // ── Parse Icecat JSON response ────────────────────────────────────────────
    private async Task<(ProductSpec? spec, string? imageUrl)> ParseIcecatResponse(
        JsonDocument json, int productId, string brand, string model)
    {
        try
        {
            var root = json.RootElement;
            if (!root.TryGetProperty("data", out var data)) return (null, null);

            var spec = new ProductSpec
            {
                ProductId      = productId,
                Brand          = brand,
                Model          = model,
                SpecSource     = "Icecat",
                LastFetchedAt  = DateTime.UtcNow
            };

            string? imageUrl = null;

            // ── Extract image URL ─────────────────────────────────────────────
            // Icecat returns images in several possible locations
            if (data.TryGetProperty("Image", out var imageObj))
            {
                // High-res image
                if (imageObj.TryGetProperty("HighPic", out var highPic))
                    imageUrl = highPic.GetString();
                // Medium image fallback
                else if (imageObj.TryGetProperty("LowPic", out var lowPic))
                    imageUrl = lowPic.GetString();
            }

            // Also check GeneralInfo for image
            if (string.IsNullOrEmpty(imageUrl) && data.TryGetProperty("GeneralInfo", out var general))
            {
                if (general.TryGetProperty("IcecatId", out var icecatId))
                {
                    var id = icecatId.GetInt32();
                    imageUrl = $"https://icecat.us/img/norm/{id}-1.jpg";
                }

                if (general.TryGetProperty("Description", out var desc))
                    spec.Model = desc.GetString() ?? model;
            }

            // ── Extract features/specs ────────────────────────────────────────
            if (data.TryGetProperty("FeaturesGroups", out var groups))
            {
                foreach (var group in groups.EnumerateArray())
                {
                    if (!group.TryGetProperty("Features", out var features)) continue;

                    foreach (var feature in features.EnumerateArray())
                    {
                        var name = feature.TryGetProperty("Feature", out var f)
                            ? f.TryGetProperty("Name", out var n) ? n.GetString() ?? "" : ""
                            : "";
                        var value = feature.TryGetProperty("Value", out var v) ? v.GetString() ?? "" : "";
                        MapIcecatFeature(spec, name.ToLower(), value);
                    }
                }
            }

            return (spec, imageUrl);
        }
        catch
        {
            return (null, null);
        }
    }

    private void MapIcecatFeature(ProductSpec spec, string name, string value)
    {
        if (name.Contains("ram") || name.Contains("memory capacity"))
            spec.RAM = value;
        else if (name.Contains("storage") || name.Contains("internal memory") || name.Contains("ssd"))
            spec.Storage = value;
        else if (name.Contains("processor") || name.Contains("cpu"))
            spec.Processor = value;
        else if (name.Contains("display size") || name.Contains("screen size"))
            spec.DisplaySize = value;
        else if (name.Contains("display type") || name.Contains("display technology"))
            spec.DisplayType = value;
        else if (name.Contains("resolution"))
            spec.DisplayResolution = value;
        else if (name.Contains("refresh rate"))
            spec.RefreshRate = value;
        else if (name.Contains("rear camera") || name.Contains("main camera") || name.Contains("back camera"))
            spec.MainCamera = value;
        else if (name.Contains("front camera") || name.Contains("selfie"))
            spec.FrontCamera = value;
        else if (name.Contains("battery capacity") || name.Contains("battery"))
            spec.BatteryCapacity = value;
        else if (name.Contains("charging"))
            spec.ChargingSpeed = value;
        else if (name.Contains("operating system") || name.Contains("os"))
            spec.OperatingSystem = value;
        else if (name.Contains("weight"))
            spec.Weight = value;
        else if (name.Contains("dimension") || name.Contains("size"))
            spec.Dimensions = value;
        else if (name.Contains("color") || name.Contains("colour"))
            spec.Color = value;
        else if (name.Contains("connectivity") || name.Contains("network"))
            spec.Connectivity = value;
        else if (name.Contains("ports") || name.Contains("interface"))
            spec.Ports = value;
        else if (name.Contains("gpu") || name.Contains("graphics"))
            spec.GPU = value;
        else if (name.Contains("vram") || name.Contains("video memory"))
            spec.VRAM = value;
        else if (name.Contains("cores"))
            spec.Cores = value;
        else if (name.Contains("clock") || name.Contains("frequency"))
            spec.ClockSpeed = value;
        else if (name.Contains("tdp") || name.Contains("thermal"))
            spec.TDP = value;
        else if (name.Contains("socket"))
            spec.Socket = value;
        else if (name.Contains("form factor"))
            spec.FormFactor = value;
    }

    private async Task<ProductSpecResponse?> CreateFallbackSpecs(int productId)
    {
        var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null) return null;

        var (brand, model) = ExtractBrandAndModel(product.Name);
        var name = product.Name.ToLower();

        var spec = new ProductSpec
        {
            ProductId     = productId,
            Brand         = brand,
            Model         = model,
            SpecSource    = "Auto-parsed",
            LastFetchedAt = DateTime.UtcNow
        };

        if (name.Contains("iphone 15 pro max"))
        { spec.RAM = "8GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "6.7\""; spec.DisplayType = "Super Retina XDR OLED"; spec.Processor = "Apple A17 Pro"; spec.MainCamera = "48MP Triple"; spec.BatteryCapacity = "4422mAh"; spec.OperatingSystem = "iOS 17"; }
        else if (name.Contains("iphone 15 pro"))
        { spec.RAM = "8GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "6.1\""; spec.DisplayType = "Super Retina XDR OLED"; spec.Processor = "Apple A17 Pro"; spec.MainCamera = "48MP Triple"; spec.BatteryCapacity = "3274mAh"; spec.OperatingSystem = "iOS 17"; }
        else if (name.Contains("iphone 15"))
        { spec.RAM = "6GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "6.1\""; spec.DisplayType = "Super Retina XDR OLED"; spec.Processor = "Apple A16 Bionic"; spec.MainCamera = "48MP Dual"; spec.BatteryCapacity = "3349mAh"; spec.OperatingSystem = "iOS 17"; }
        else if (name.Contains("galaxy s24 ultra"))
        { spec.RAM = "12GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "6.8\""; spec.DisplayType = "Dynamic AMOLED 2X"; spec.Processor = "Snapdragon 8 Gen 3"; spec.MainCamera = "200MP Quad"; spec.BatteryCapacity = "5000mAh"; spec.OperatingSystem = "Android 14"; spec.RefreshRate = "120Hz"; }
        else if (name.Contains("macbook pro 14") && name.Contains("m3"))
        { spec.RAM = "18GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "14.2\""; spec.DisplayType = "Liquid Retina XDR"; spec.Processor = "Apple M3 Pro"; spec.OperatingSystem = "macOS Sonoma"; spec.RefreshRate = "120Hz"; }
        else if (name.Contains("macbook air") && name.Contains("m2"))
        { spec.RAM = "8GB"; spec.Storage = ParseStorage(name); spec.DisplaySize = "13.6\""; spec.DisplayType = "Liquid Retina"; spec.Processor = "Apple M2"; spec.OperatingSystem = "macOS Sonoma"; spec.BatteryCapacity = "52.6Wh"; }
        else if (name.Contains("rtx 4090"))
        { spec.VRAM = "24GB GDDR6X"; spec.GPU = "NVIDIA RTX 4090"; spec.TDP = "450W"; spec.Ports = "3x DisplayPort 1.4, 1x HDMI 2.1"; }
        else if (name.Contains("rtx 4070"))
        { spec.VRAM = "12GB GDDR6X"; spec.GPU = "NVIDIA RTX 4070 Super"; spec.TDP = "220W"; spec.Ports = "3x DisplayPort 1.4, 1x HDMI 2.1"; }
        else if (name.Contains("i9-14900") || name.Contains("i9 14900"))
        { spec.Cores = "24 (8P+16E)"; spec.ClockSpeed = "Up to 6.0GHz"; spec.Socket = "LGA1700"; spec.TDP = "125W"; spec.Processor = "Intel Core i9-14900K"; }
        else if (name.Contains("ryzen 9 7950"))
        { spec.Cores = "16 (32 threads)"; spec.ClockSpeed = "Up to 5.7GHz"; spec.Socket = "AM5"; spec.TDP = "170W"; spec.Processor = "AMD Ryzen 9 7950X"; }
        else if (name.Contains("airpods pro"))
        { spec.Connectivity = "Bluetooth 5.3"; spec.BatteryCapacity = "30hrs with case"; spec.Processor = "Apple H2"; }
        else if (name.Contains("wh-1000xm5") || name.Contains("sony wh"))
        { spec.Connectivity = "Bluetooth 5.2, NFC"; spec.BatteryCapacity = "30hrs"; spec.Weight = "250g"; }

        if (spec.Storage == null) spec.Storage = ParseStorage(name);

        // Save known product image
        var knownImage = GetKnownProductImage(product.Name);
        if (knownImage != null)
            await SaveProductImage(productId, knownImage);

        var existing = await _db.ProductSpecs.FirstOrDefaultAsync(s => s.ProductId == productId);
        if (existing != null) { _db.ProductSpecs.Remove(existing); await _db.SaveChangesAsync(); }

        _db.ProductSpecs.Add(spec);
        await _db.SaveChangesAsync();

        return MapToResponse(spec);
    }

    private string ParseStorage(string name)
    {
        var patterns = new[] { "1tb", "512gb", "256gb", "128gb", "64gb", "2tb" };
        foreach (var p in patterns)
            if (name.Contains(p)) return p.ToUpper();
        return "Varies";
    }

    private (string brand, string model) ExtractBrandAndModel(string name)
    {
        var brands = new Dictionary<string, string[]>
        {
            ["Apple"]   = ["iphone", "macbook", "ipad", "airpods", "apple"],
            ["Samsung"] = ["samsung", "galaxy"],
            ["Google"]  = ["google", "pixel"],
            ["Xiaomi"]  = ["xiaomi"],
            ["ASUS"]    = ["asus", "rog", "zenbook", "vivobook"],
            ["MSI"]     = ["msi", "raider", "stealth"],
            ["Lenovo"]  = ["lenovo", "legion", "thinkpad", "ideapad"],
            ["Dell"]    = ["dell", "xps", "inspiron"],
            ["HP"]      = ["hp", "spectre", "envy", "pavilion"],
            ["Sony"]    = ["sony", "wh-", "wf-"],
            ["NVIDIA"]  = ["nvidia", "rtx", "gtx"],
            ["AMD"]     = ["amd", "ryzen", "radeon", "rx "],
            ["Intel"]   = ["intel", "core i"],
            ["Corsair"] = ["corsair"],
            ["G.Skill"] = ["g.skill", "trident"],
            ["LG"]      = ["lg"],
        };

        var lower = name.ToLower();
        foreach (var (brand, keywords) in brands)
            foreach (var kw in keywords)
                if (lower.Contains(kw))
                    return (brand, name);

        var parts = name.Split(' ');
        return (parts[0], name);
    }


    // ── Known product image URLs (reliable, no hotlink blocking) ─────────────
    private string? GetKnownProductImage(string name)
    {
        var lower = name.ToLower();
        var images = new Dictionary<string, string>
        {
            ["iphone 15 pro max"]  = "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg",
            ["iphone 15 pro"]      = "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-1.jpg",
            ["iphone 15"]          = "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg",
            ["galaxy s24 ultra"]   = "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-1.jpg",
            ["galaxy s24"]         = "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-1.jpg",
            ["galaxy a55"]         = "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-a55-1.jpg",
            ["pixel 8 pro"]        = "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg",
            ["pixel 8"]            = "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-1.jpg",
            ["macbook pro"]        = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90",
            ["macbook air"]        = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90",
            ["rog strix g16"]      = "https://dlcdnwebimgs.asus.com/gain/0F4B4FC3-A6B8-4B00-85E4-F4B28F4B35E8/w800/fwebp",
            ["msi raider"]         = "https://storage-asset.msi.com/global/picture/image/feature/nb/Raider-GE78-HX/kv.png",
            ["airpods pro"]        = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=532&hei=532&fmt=jpeg&qlt=95",
            ["wh-1000xm5"]         = "https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=pjpeg&wid=440",
            ["ipad pro"]           = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spacegray-202210?wid=470&hei=556&fmt=jpeg&qlt=95",
            ["rtx 4090"]           = "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500",
            ["rtx 4070"]           = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500",
            ["i9-14900"]           = "https://images.unsplash.com/photo-1620843232693-aa3de48fcd32?w=500",
            ["ryzen 9"]            = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500",
            ["corsair vengeance"]  = "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500",
            ["odyssey g9"]         = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500",
        };

        foreach (var (key, url) in images)
            if (lower.Contains(key)) return url;

        return null;
    }

    private static ProductSpecResponse MapToResponse(ProductSpec s) => new(
        s.ProductId, s.Brand, s.Model, s.DisplaySize, s.DisplayType, s.DisplayResolution,
        s.RefreshRate, s.Processor, s.RAM, s.Storage, s.GPU, s.OperatingSystem,
        s.MainCamera, s.FrontCamera, s.BatteryCapacity, s.ChargingSpeed,
        s.Connectivity, s.Ports, s.Weight, s.Dimensions, s.Color,
        s.VRAM, s.Cores, s.ClockSpeed, s.TDP, s.MemoryType, s.MemorySpeed,
        s.FormFactor, s.Socket, s.SpecSource, s.LastFetchedAt
    );
}
