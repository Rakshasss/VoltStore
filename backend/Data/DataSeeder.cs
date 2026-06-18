using Adashop.Entities;
using Adashop.Enums;
using Microsoft.EntityFrameworkCore;

namespace Adashop.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(DataContext db)
    {
        await SeedDeliveryMethods(db);
        await SeedCategories(db);
        await SeedProducts(db);
        await SeedAdminUser(db);
        await SeedManagerUser(db);
    }

    private static async Task SeedDeliveryMethods(DataContext db)
    {
        if (await db.DeliveryMethods.AnyAsync()) return;

        db.DeliveryMethods.AddRange(
            new DeliveryMethod
            {
                Name = "Store Pickup",
                Description = "Pick up from our Tbilisi store — Free",
                Price = 0,
                EstimatedDays = 0,
                IsActive = true
            },
            new DeliveryMethod
            {
                Name = "Standard Delivery",
                Description = "3-5 business days nationwide",
                Price = 5,
                EstimatedDays = 4,
                IsActive = true
            },
            new DeliveryMethod
            {
                Name = "Express Delivery",
                Description = "Next business day in Tbilisi",
                Price = 15,
                EstimatedDays = 1,
                IsActive = true
            }
        );
        await db.SaveChangesAsync();
    }

    private static async Task SeedCategories(DataContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var phones      = new Category { Name = "Phones" };
        var laptops     = new Category { Name = "Laptops" };
        var tablets     = new Category { Name = "Tablets" };
        var accessories = new Category { Name = "Accessories" };
        var components  = new Category { Name = "PC Components" };
        var tvs         = new Category { Name = "TVs & Monitors" };

        db.Categories.AddRange(phones, laptops, tablets, accessories, components, tvs);
        await db.SaveChangesAsync();

        db.Categories.AddRange(
            new Category { Name = "Smartphones",       ParentCategoryId = phones.Id },
            new Category { Name = "Basic Phones",      ParentCategoryId = phones.Id },
            new Category { Name = "Gaming Laptops",    ParentCategoryId = laptops.Id },
            new Category { Name = "Office Laptops",    ParentCategoryId = laptops.Id },
            new Category { Name = "iPads",             ParentCategoryId = tablets.Id },
            new Category { Name = "Android Tablets",   ParentCategoryId = tablets.Id },
            new Category { Name = "Headphones",        ParentCategoryId = accessories.Id },
            new Category { Name = "Chargers & Cables", ParentCategoryId = accessories.Id },
            new Category { Name = "Phone Cases",       ParentCategoryId = accessories.Id },
            new Category { Name = "Graphics Cards",    ParentCategoryId = components.Id },
            new Category { Name = "Processors",        ParentCategoryId = components.Id },
            new Category { Name = "RAM",               ParentCategoryId = components.Id },
            new Category { Name = "Monitors",          ParentCategoryId = tvs.Id }
        );
        await db.SaveChangesAsync();
    }

    private static async Task SeedProducts(DataContext db)
    {
        if (await db.Products.AnyAsync()) return;

        var cats = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.Id);

        var products = new List<(Product product, ProductSpec spec)>
        {
            (
                new Product { Name = "iPhone 15 Pro Max 256GB", Description = "Apple A17 Pro chip, 6.7\" Super Retina XDR, 48MP camera system, Titanium design", Price = 3299, Stock = 15, CategoryId = cats["Smartphones"] },
                new ProductSpec { Brand = "Apple", Model = "iPhone 15 Pro Max", RAM = "8GB", Storage = "256GB", DisplaySize = "6.7\"", DisplayType = "Super Retina XDR OLED", Processor = "Apple A17 Pro", MainCamera = "48MP Triple", FrontCamera = "12MP TrueDepth", BatteryCapacity = "4422mAh", OperatingSystem = "iOS 17", RefreshRate = "120Hz", Connectivity = "5G, Wi-Fi 6E", Weight = "221g", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Samsung Galaxy S24 Ultra 512GB", Description = "Snapdragon 8 Gen 3, 6.8\" Dynamic AMOLED, 200MP camera, built-in S Pen", Price = 2999, Stock = 20, CategoryId = cats["Smartphones"] },
                new ProductSpec { Brand = "Samsung", Model = "Galaxy S24 Ultra", RAM = "12GB", Storage = "512GB", DisplaySize = "6.8\"", DisplayType = "Dynamic AMOLED 2X", Processor = "Snapdragon 8 Gen 3", MainCamera = "200MP Quad", FrontCamera = "12MP", BatteryCapacity = "5000mAh", OperatingSystem = "Android 14", RefreshRate = "120Hz", Connectivity = "5G, Wi-Fi 7", Weight = "232g", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "iPhone 15 128GB", Description = "Apple A16 Bionic, 6.1\" Super Retina XDR, Dynamic Island, USB-C", Price = 2199, Stock = 25, CategoryId = cats["Smartphones"] },
                new ProductSpec { Brand = "Apple", Model = "iPhone 15", RAM = "6GB", Storage = "128GB", DisplaySize = "6.1\"", DisplayType = "Super Retina XDR OLED", Processor = "Apple A16 Bionic", MainCamera = "48MP Dual", FrontCamera = "12MP TrueDepth", BatteryCapacity = "3349mAh", OperatingSystem = "iOS 17", RefreshRate = "60Hz", Connectivity = "5G, Wi-Fi 6", Weight = "171g", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Samsung Galaxy A55 5G 256GB", Description = "Exynos 1480, 6.6\" Super AMOLED, 50MP camera, 5000mAh battery", Price = 899, Stock = 40, CategoryId = cats["Smartphones"] },
                new ProductSpec { Brand = "Samsung", Model = "Galaxy A55 5G", RAM = "8GB", Storage = "256GB", DisplaySize = "6.6\"", DisplayType = "Super AMOLED", Processor = "Exynos 1480", MainCamera = "50MP Triple", FrontCamera = "32MP", BatteryCapacity = "5000mAh", OperatingSystem = "Android 14", RefreshRate = "120Hz", Connectivity = "5G, Wi-Fi 6", Weight = "213g", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Google Pixel 8 Pro 256GB", Description = "Google Tensor G3, 6.7\" LTPO OLED, 50MP triple camera, 7 years of updates", Price = 1999, Stock = 12, CategoryId = cats["Smartphones"] },
                new ProductSpec { Brand = "Google", Model = "Pixel 8 Pro", RAM = "12GB", Storage = "256GB", DisplaySize = "6.7\"", DisplayType = "LTPO OLED", Processor = "Google Tensor G3", MainCamera = "50MP Triple", FrontCamera = "10.5MP", BatteryCapacity = "5050mAh", OperatingSystem = "Android 14", RefreshRate = "120Hz", Connectivity = "5G, Wi-Fi 7", Weight = "213g", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "ASUS ROG Strix G16 RTX 4070", Description = "Intel Core i9-14900HX, RTX 4070, 16GB DDR5, 1TB NVMe, 240Hz QHD", Price = 4599, Stock = 8, CategoryId = cats["Gaming Laptops"] },
                new ProductSpec { Brand = "ASUS", Model = "ROG Strix G16", RAM = "16GB DDR5", Storage = "1TB NVMe SSD", DisplaySize = "16\"", DisplayType = "IPS", DisplayResolution = "2560x1600", Processor = "Intel Core i9-14900HX", GPU = "NVIDIA RTX 4070", OperatingSystem = "Windows 11", RefreshRate = "240Hz", Ports = "USB-C, USB-A, HDMI 2.1, SD Card", Weight = "2.5kg", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "MSI Raider GE78 HX RTX 4080", Description = "Intel Core i9-14900HX, RTX 4080, 32GB DDR5, 2TB NVMe, 17.3\" 240Hz", Price = 6999, Stock = 5, CategoryId = cats["Gaming Laptops"] },
                new ProductSpec { Brand = "MSI", Model = "Raider GE78 HX", RAM = "32GB DDR5", Storage = "2TB NVMe SSD", DisplaySize = "17.3\"", DisplayType = "IPS", DisplayResolution = "1920x1080", Processor = "Intel Core i9-14900HX", GPU = "NVIDIA RTX 4080", OperatingSystem = "Windows 11", RefreshRate = "240Hz", Weight = "3.1kg", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "MacBook Pro 14\" M3 Pro 512GB", Description = "Apple M3 Pro chip, 18GB unified memory, 512GB SSD, Liquid Retina XDR", Price = 5499, Stock = 7, CategoryId = cats["Office Laptops"] },
                new ProductSpec { Brand = "Apple", Model = "MacBook Pro 14\"", RAM = "18GB Unified", Storage = "512GB SSD", DisplaySize = "14.2\"", DisplayType = "Liquid Retina XDR", DisplayResolution = "3024x1964", Processor = "Apple M3 Pro", OperatingSystem = "macOS Sonoma", RefreshRate = "120Hz", Ports = "3x Thunderbolt 4, HDMI, SD Card, MagSafe 3", Weight = "1.61kg", BatteryCapacity = "70Wh", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "MacBook Air 13\" M2 256GB", Description = "Apple M2 chip, 8GB memory, 256GB SSD, 13.6\" Liquid Retina, 18hr battery", Price = 3299, Stock = 15, CategoryId = cats["Office Laptops"] },
                new ProductSpec { Brand = "Apple", Model = "MacBook Air 13\"", RAM = "8GB Unified", Storage = "256GB SSD", DisplaySize = "13.6\"", DisplayType = "Liquid Retina", DisplayResolution = "2560x1664", Processor = "Apple M2", OperatingSystem = "macOS Sonoma", Ports = "2x Thunderbolt 4, MagSafe 3", Weight = "1.24kg", BatteryCapacity = "52.6Wh", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Apple AirPods Pro 2nd Gen", Description = "Active Noise Cancellation, Adaptive Audio, H2 chip, 30hr battery with case", Price = 799, Stock = 30, CategoryId = cats["Headphones"] },
                new ProductSpec { Brand = "Apple", Model = "AirPods Pro 2", Processor = "Apple H2", BatteryCapacity = "30hrs with case", Connectivity = "Bluetooth 5.3", Weight = "5.3g each", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Sony WH-1000XM5 Wireless", Description = "Industry-leading ANC, 30hr battery, multipoint connection, speak-to-chat", Price = 899, Stock = 20, CategoryId = cats["Headphones"] },
                new ProductSpec { Brand = "Sony", Model = "WH-1000XM5", BatteryCapacity = "30hrs", Connectivity = "Bluetooth 5.2, NFC, 3.5mm", Weight = "250g", ChargingSpeed = "USB-C, 3min = 3hrs", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "NVIDIA RTX 4090 24GB", Description = "16384 CUDA cores, 24GB GDDR6X, DLSS 3, AV1 encode/decode", Price = 5999, Stock = 4, CategoryId = cats["Graphics Cards"] },
                new ProductSpec { Brand = "NVIDIA", Model = "RTX 4090", VRAM = "24GB GDDR6X", GPU = "NVIDIA RTX 4090", TDP = "450W", Cores = "16384 CUDA", Ports = "3x DisplayPort 1.4a, 1x HDMI 2.1", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "NVIDIA RTX 4070 Super 12GB", Description = "7168 CUDA cores, 12GB GDDR6X, DLSS 3.5, great 1440p performance", Price = 2299, Stock = 8, CategoryId = cats["Graphics Cards"] },
                new ProductSpec { Brand = "NVIDIA", Model = "RTX 4070 Super", VRAM = "12GB GDDR6X", GPU = "NVIDIA RTX 4070 Super", TDP = "220W", Cores = "7168 CUDA", Ports = "3x DisplayPort 1.4a, 1x HDMI 2.1", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Intel Core i9-14900K", Description = "24 cores (8P+16E), up to 6.0GHz boost, 36MB cache, LGA1700", Price = 1799, Stock = 12, CategoryId = cats["Processors"] },
                new ProductSpec { Brand = "Intel", Model = "Core i9-14900K", Cores = "24 (8P+16E)", ClockSpeed = "Up to 6.0GHz", Socket = "LGA1700", TDP = "125W", MemoryType = "DDR5/DDR4", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "AMD Ryzen 9 7950X", Description = "16 cores, 32 threads, up to 5.7GHz boost, 80MB cache, AM5 socket", Price = 1999, Stock = 8, CategoryId = cats["Processors"] },
                new ProductSpec { Brand = "AMD", Model = "Ryzen 9 7950X", Cores = "16C/32T", ClockSpeed = "Up to 5.7GHz", Socket = "AM5", TDP = "170W", MemoryType = "DDR5", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Corsair Vengeance 32GB DDR5-6000", Description = "2x16GB DDR5, 6000MHz, CL30, Intel XMP 3.0", Price = 499, Stock = 25, CategoryId = cats["RAM"] },
                new ProductSpec { Brand = "Corsair", Model = "Vengeance DDR5", RAM = "32GB (2x16GB)", MemoryType = "DDR5", MemorySpeed = "6000MHz", FormFactor = "DIMM", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "Samsung Odyssey G9 49\" Curved", Description = "49\" 1000R curved, 5120x1440, 240Hz, 1ms, G-Sync & FreeSync", Price = 3999, Stock = 5, CategoryId = cats["Monitors"] },
                new ProductSpec { Brand = "Samsung", Model = "Odyssey G9", DisplaySize = "49\"", DisplayType = "VA Curved 1000R", DisplayResolution = "5120x1440", RefreshRate = "240Hz", Ports = "2x HDMI 2.1, 1x DisplayPort 1.4, 4x USB", Weight = "16.6kg", SpecSource = "Auto" }
            ),
            (
                new Product { Name = "iPad Pro 12.9\" M2 256GB Wi-Fi", Description = "Apple M2 chip, 12.9\" Liquid Retina XDR, ProMotion 120Hz, Wi-Fi 6E", Price = 2799, Stock = 10, CategoryId = cats["iPads"] },
                new ProductSpec { Brand = "Apple", Model = "iPad Pro 12.9\"", RAM = "8GB", Storage = "256GB", DisplaySize = "12.9\"", DisplayType = "Liquid Retina XDR", DisplayResolution = "2732x2048", Processor = "Apple M2", RefreshRate = "120Hz", Connectivity = "Wi-Fi 6E, Bluetooth 5.3", Weight = "682g", SpecSource = "Auto" }
            ),
        };

        foreach (var (product, spec) in products)
        {
            db.Products.Add(product);
            await db.SaveChangesAsync();

            spec.ProductId = product.Id;
            spec.LastFetchedAt = DateTime.UtcNow;
            db.ProductSpecs.Add(spec);

            db.ProductImages.Add(new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = GetProductImage(product.Name),
                IsMain = true,
                SortOrder = 1
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminUser(DataContext db)
    {
        if (await db.Users.AnyAsync(u => u.Role == UserRole.Admin)) return;

        var admin = new User
        {
            Email = "admin@voltstore.ge",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = UserRole.Admin,
            IsVerified = true,
            UserDetails = new UserDetails { FirstName = "Admin", LastName = "VoltStore" }
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }

    private static async Task SeedManagerUser(DataContext db)
    {
        if (await db.Users.AnyAsync(u => u.Role == UserRole.Manager)) return;

        var manager = new User
        {
            Email = "manager@voltstore.ge",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
            Role = UserRole.Manager,
            IsVerified = true,
            UserDetails = new UserDetails { FirstName = "Manager", LastName = "VoltStore" }
        };
        db.Users.Add(manager);
        await db.SaveChangesAsync();
    }

    private static string GetProductImage(string name)
    {
        var lower = name.ToLower();
        if (lower.Contains("iphone 15 pro max")) return "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500";
        if (lower.Contains("iphone 15 pro"))     return "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500";
        if (lower.Contains("iphone 15"))          return "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500";
        if (lower.Contains("galaxy s24 ultra"))   return "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500";
        if (lower.Contains("galaxy s24"))         return "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500";
        if (lower.Contains("galaxy a55"))         return "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500";
        if (lower.Contains("pixel"))              return "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500";
        if (lower.Contains("rog strix"))          return "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500";
        if (lower.Contains("msi raider"))         return "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500";
        if (lower.Contains("macbook pro"))        return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500";
        if (lower.Contains("macbook air"))        return "https://images.unsplash.com/photo-1611186871525-69eeb5e363c2?w=500";
        if (lower.Contains("airpods"))            return "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500";
        if (lower.Contains("wh-1000"))            return "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500";
        if (lower.Contains("rtx 4090"))           return "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500";
        if (lower.Contains("rtx 4070"))           return "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500";
        if (lower.Contains("i9-14900"))           return "https://images.unsplash.com/photo-1620843232693-aa3de48fcd32?w=500";
        if (lower.Contains("ryzen 9"))            return "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500";
        if (lower.Contains("corsair"))            return "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500";
        if (lower.Contains("odyssey"))            return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500";
        if (lower.Contains("ipad"))               return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500";
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500";
    }
}
