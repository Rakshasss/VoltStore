using Adashop.DTOs;
using Adashop.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adashop.Controllers;

[ApiController]
[Route("api/delivery-methods")]
public class DeliveryMethodsController : ControllerBase
{
    private readonly DataContext _db;
    public DeliveryMethodsController(DataContext db) => _db = db;

    /// <summary>Get all available delivery methods</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var methods = await _db.DeliveryMethods
            .Where(d => d.IsActive)
            .OrderBy(d => d.Price)
            .Select(d => new DeliveryMethodResponse(
                d.Id, d.Name, d.Description, d.Price, d.EstimatedDays))
            .ToListAsync();

        return Ok(new { status = 200, value = methods });
    }
}
