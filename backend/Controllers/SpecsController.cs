using Adashop.Data;
using Adashop.DTOs;
using Adashop.Entities;
using Adashop.Services.Specs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adashop.Controllers;

[ApiController]
[Route("api/specs")]
public class SpecsController : ControllerBase
{
    private readonly ISpecsService _specsService;
    private readonly DataContext _db;

    public SpecsController(ISpecsService specsService, DataContext db)
    {
        _specsService = specsService;
        _db = db;
    }

    /// <summary>Get specifications for a product</summary>
    [HttpGet("{productId}")]
    public async Task<IActionResult> GetSpecs(int productId)
    {
        var result = await _specsService.GetSpecsByProductId(productId);
        if (result == null) return NotFound(new { message = "No specs found for this product" });
        return Ok(new { status = 200, value = result });
    }

    /// <summary>Fetch specs from Icecat and save image (Admin/Manager only)</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{productId}/fetch")]
    public async Task<IActionResult> FetchFromIcecat(int productId)
    {
        var result = await _specsService.FetchFromIcecat(productId);
        if (result == null) return NotFound(new { message = "Could not fetch specs" });

        // Save image based on brand/model from specs
        var imageUrl = GetImageUrl(result);
        if (!string.IsNullOrEmpty(imageUrl))
        {
            try
            {
                // Remove existing main images
                var existing = await _db.ProductImages
                    .Where(i => i.ProductId == productId && i.IsMain)
                    .ToListAsync();

                if (existing.Any())
                {
                    _db.ProductImages.RemoveRange(existing);
                    await _db.SaveChangesAsync();
                }

                // Add new image
                _db.ProductImages.Add(new ProductImage
                {
                    ProductId = productId,
                    ImageUrl  = imageUrl,
                    IsMain    = true,
                    SortOrder = 1
                });
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Image save failed: {ex.Message}");
            }
        }

        return Ok(new { status = 200, value = result, imageUrl });
    }

    /// <summary>Manually update specs (Admin/Manager only)</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{productId}")]
    public async Task<IActionResult> UpdateSpecs(int productId, [FromBody] UpdateProductSpecRequest request)
    {
        var result = await _specsService.UpdateSpecsManually(productId, request);
        return Ok(new { status = 200, value = result });
    }

    // ── Map brand/model to known product image URLs ───────────────────────────
    private static string? GetImageUrl(ProductSpecResponse spec)
    {
        var name = (spec.Model ?? spec.Brand ?? "").ToLower();

        if (name.Contains("iphone 15 pro max"))
            return "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg";
        if (name.Contains("iphone 15 pro"))
            return "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-1.jpg";
        if (name.Contains("iphone 15"))
            return "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg";
        if (name.Contains("galaxy s24 ultra"))
            return "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-1.jpg";
        if (name.Contains("galaxy s24"))
            return "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-1.jpg";
        if (name.Contains("galaxy a55"))
            return "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-a55-1.jpg";
        if (name.Contains("pixel 8 pro"))
            return "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg";
        if (name.Contains("pixel 8"))
            return "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-1.jpg";
        if (name.Contains("macbook pro"))
            return "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90";
        if (name.Contains("macbook air"))
            return "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90";
        if (name.Contains("rog strix"))
            return "https://dlcdnwebimgs.asus.com/gain/0F4B4FC3-A6B8-4B00-85E4-F4B28F4B35E8/w800/fwebp";
        if (name.Contains("msi raider"))
            return "https://storage-asset.msi.com/global/picture/image/feature/nb/Raider-GE78-HX/kv.png";
        if (name.Contains("airpods pro"))
            return "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=532&hei=532&fmt=jpeg&qlt=95";
        if (name.Contains("wh-1000xm5") || name.Contains("wh1000xm5"))
            return "https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=pjpeg&wid=440";
        if (name.Contains("ipad pro"))
            return "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spacegray-202210?wid=470&hei=556&fmt=jpeg&qlt=95";
        if (name.Contains("rtx 4090"))
            return "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500";
        if (name.Contains("rtx 4070"))
            return "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500";
        if (name.Contains("i9-14900") || name.Contains("i9 14900"))
            return "https://images.unsplash.com/photo-1620843232693-aa3de48fcd32?w=500";
        if (name.Contains("ryzen 9"))
            return "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500";
        if (name.Contains("corsair"))
            return "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500";
        if (name.Contains("odyssey"))
            return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500";
        if (name.Contains("galaxy s24 ultra"))
            return "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-1.jpg";
        if (name.Contains("rog strix g16"))
            return "https://dlcdnwebimgs.asus.com/gain/0F4B4FC3-A6B8-4B00-85E4-F4B28F4B35E8/w800/fwebp";
        if (name.Contains("msi raider ge78"))
            return "https://storage-asset.msi.com/global/picture/image/feature/nb/Raider-GE78-HX/kv.png";
        if (name.Contains("corsair vengeance"))
            return "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500";
        if (name.Contains("i9-14900") || name.Contains("i9 14900"))
            return "https://images.unsplash.com/photo-1620843232693-aa3de48fcd32?w=500";
        if (name.Contains("rtx 4070 super") || name.Contains("rtx 4070"))
            return "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500";
        if (name.Contains("rtx 4090"))
            return "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500";

        return null;
    }
}
