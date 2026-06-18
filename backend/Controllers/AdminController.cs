using Adashop.DTOs;
using Adashop.Services.Admin;
using Adashop.Data;
using Adashop.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adashop.Controllers;

[Authorize(Roles = "Admin,Manager")]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminServices _adminServices;
    private readonly DataContext _db;

    public AdminController(IAdminServices adminServices, DataContext db)
    {
        _adminServices = adminServices;
        _db = db;
    }

    // ── USERS ──────────────────────────────────────────────────────────────────

    /// <summary>Get all users (Admin only)</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _adminServices.GetAllUsers();
        return StatusCode(result.Status, result);
    }

    /// <summary>Get user by ID with cart and orders (Admin only)</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var result = await _adminServices.GetUserById(id);
        return StatusCode(result.Status, result);
    }

    // ── ORDERS ─────────────────────────────────────────────────────────────────

    /// <summary>Get all orders (Admin and Manager)</summary>
    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders()
    {
        var result = await _adminServices.GetAllOrders();
        return StatusCode(result.Status, result);
    }

    /// <summary>Get order by ID (Admin and Manager)</summary>
    [HttpGet("orders/{orderId}")]
    public async Task<IActionResult> GetOrder(int orderId)
    {
        var result = await _adminServices.GetOrderById(orderId);
        return StatusCode(result.Status, result);
    }

    /// <summary>Update order status - Admin and Manager can update tracking</summary>
    [HttpPut("orders/{orderId}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.DeliveryMethod)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        // Parse and validate status
        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            return BadRequest(new { message = $"Invalid status: {request.Status}" });

        order.Status = newStatus;
        if (request.TrackingNumber != null) order.TrackingNumber = request.TrackingNumber;
        if (request.TrackingNotes  != null) order.TrackingNotes  = request.TrackingNotes;

        // Auto-set timestamps
        if (newStatus == OrderStatus.Paid && !order.IsPaid)
        {
            order.IsPaid  = true;
            order.PaidAt  = DateTime.UtcNow;
        }
        if (newStatus == OrderStatus.Shipped && order.ShippedAt == null)
            order.ShippedAt = DateTime.UtcNow;
        if (newStatus == OrderStatus.Delivered && order.DeliveredAt == null)
            order.DeliveredAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            status = 200,
            value = new
            {
                order.Id,
                Status          = order.Status.ToString(),
                order.TrackingNumber,
                order.TrackingNotes,
                order.IsPaid,
                ShippedAt       = order.ShippedAt?.ToString("yyyy-MM-dd"),
                DeliveredAt     = order.DeliveredAt?.ToString("yyyy-MM-dd"),
            }
        });
    }

    // ── PRODUCTS (Admin only) ──────────────────────────────────────────────────

    [Authorize(Roles = "Admin")]
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(CreateProductRequest request)
    {
        var result = await _adminServices.CreateProduct(request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, UpdateProductRequest request)
    {
        var result = await _adminServices.UpdateProduct(id, request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var result = await _adminServices.DeleteProduct(id);
        return StatusCode(result.Status, result);
    }

    // ── CATEGORIES (Admin only) ────────────────────────────────────────────────

    [Authorize(Roles = "Admin")]
    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest request)
    {
        var result = await _adminServices.CreateCategory(request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryRequest request)
    {
        var result = await _adminServices.UpdateCategory(id, request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var result = await _adminServices.DeleteCategory(id);
        return StatusCode(result.Status, result);
    }

    // ── PRODUCT IMAGES ─────────────────────────────────────────────────────────

    [Authorize(Roles = "Admin")]
    [HttpPost("product-images")]
    public async Task<IActionResult> CreateProductImage(CreateProductImageRequest request)
    {
        var result = await _adminServices.CreateProductImage(request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("product-images/{id}")]
    public async Task<IActionResult> UpdateProductImage(int id, UpdateProductImageRequest request)
    {
        var result = await _adminServices.UpdateProductImage(id, request);
        return StatusCode(result.Status, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("product-images/{id}")]
    public async Task<IActionResult> DeleteProductImage(int id)
    {
        var result = await _adminServices.DeleteProductImage(id);
        return StatusCode(result.Status, result);
    }

    // ── DELIVERY METHODS ───────────────────────────────────────────────────────

    [HttpGet("delivery-methods")]
    public async Task<IActionResult> GetDeliveryMethods()
    {
        var methods = await _db.DeliveryMethods
            .Where(d => d.IsActive)
            .Select(d => new DeliveryMethodResponse(d.Id, d.Name, d.Description, d.Price, d.EstimatedDays))
            .ToListAsync();
        return Ok(new { status = 200, value = methods });
    }
}
