namespace Adashop.DTOs;

public record CreateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    int CategoryId
);

public record UpdateProductRequest(
    string? Name,
    string? Description,
    decimal? Price,
    int? Stock,
    int? CategoryId
);

public record CreateCategoryRequest(
    string Name,
    int? ParentCategoryId
);

public record UpdateCategoryRequest(
    string? Name,
    int? ParentCategoryId
);

public record CreateProductImageRequest(
    string ImageUrl,
    bool IsMain,
    int SortOrder,
    int ProductId
);

public record UpdateProductImageRequest(
    string? ImageUrl,
    bool? IsMain,
    int? SortOrder
);

// ── USERS ─────────────────────────────────────────────────────────────────────

public record AllUsersResponse(
    List<UserMinimalResponse> Users,
    int TotalCount
);

public record UserMinimalResponse(
    int Id,
    string Email,
    string Role,
    bool IsVerified,
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    string? Address,
    DateTime? LastLoginAt,
    string CreatedAt
);

public record UserDetailResponse(
    int Id,
    string Email,
    string Role,
    bool IsVerified,
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    string? Address,
    DateTime? LastLoginAt,
    string CreatedAt,
    CartResponse? Cart,
    List<OrderResponse> Orders
);

// ── ORDERS ────────────────────────────────────────────────────────────────────

public record AllOrdersResponse(
    List<AdminOrderResponse> Orders,
    int TotalCount
);

public record AdminOrderResponse(
    int Id,
    string Status,
    string ShippingAddress,
    decimal TotalPrice,
    decimal DeliveryPrice,
    decimal GrandTotal,
    string PaymentMethod,
    bool IsPaid,
    string? TrackingNumber,
    string? TrackingNotes,
    string? EstimatedDeliveryDate,
    int UserId,
    string UserEmail,
    string? DeliveryMethodName,
    List<OrderItemResponse> Items,
    string CreatedAt
);

// ── SPECS ─────────────────────────────────────────────────────────────────────

public record ProductSpecResponse(
    int ProductId,
    string? Brand,
    string? Model,
    string? DisplaySize,
    string? DisplayType,
    string? DisplayResolution,
    string? RefreshRate,
    string? Processor,
    string? RAM,
    string? Storage,
    string? GPU,
    string? OperatingSystem,
    string? MainCamera,
    string? FrontCamera,
    string? BatteryCapacity,
    string? ChargingSpeed,
    string? Connectivity,
    string? Ports,
    string? Weight,
    string? Dimensions,
    string? Color,
    string? VRAM,
    string? Cores,
    string? ClockSpeed,
    string? TDP,
    string? MemoryType,
    string? MemorySpeed,
    string? FormFactor,
    string? Socket,
    string? SpecSource,
    DateTime? LastFetchedAt
);

public record UpdateProductSpecRequest(
    string? Brand,
    string? Model,
    string? DisplaySize,
    string? DisplayType,
    string? DisplayResolution,
    string? RefreshRate,
    string? Processor,
    string? RAM,
    string? Storage,
    string? GPU,
    string? OperatingSystem,
    string? MainCamera,
    string? FrontCamera,
    string? BatteryCapacity,
    string? ChargingSpeed,
    string? Connectivity,
    string? Ports,
    string? Weight,
    string? Dimensions,
    string? Color,
    string? VRAM,
    string? Cores,
    string? ClockSpeed,
    string? TDP,
    string? MemoryType,
    string? MemorySpeed,
    string? FormFactor,
    string? Socket
);
