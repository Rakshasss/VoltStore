using Adashop.Common.Entities;

namespace Adashop.Entities;

public class DeliveryMethod : BaseEntity
{
    public required string Name { get; set; }          // "Standard", "Express", "Pickup"
    public required string Description { get; set; }   // "3-5 business days"
    public decimal Price { get; set; }                 // 0 for free, 5 for standard, 15 for express
    public int EstimatedDays { get; set; }             // 3, 1, 0
    public bool IsActive { get; set; } = true;

    public List<Order> Orders { get; set; } = [];
}
