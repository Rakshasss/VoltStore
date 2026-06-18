using Adashop.Common.Entities;
using Adashop.Enums;

namespace Adashop.Entities;

public class Order : BaseEntity
{
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public required string ShippingAddress { get; set; }
    public decimal TotalPrice { get; set; }

    // Payment
    public string PaymentMethod { get; set; } = "Card"; // Card, Cash
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }

    // Delivery
    public int? DeliveryMethodId { get; set; }
    public DeliveryMethod? DeliveryMethod { get; set; }
    public decimal DeliveryPrice { get; set; } = 0;
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    // Tracking
    public string? TrackingNumber { get; set; }
    public string? TrackingNotes { get; set; }

    public List<OrderItem> OrderItems { get; set; } = [];

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
