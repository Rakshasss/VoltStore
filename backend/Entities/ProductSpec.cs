using Adashop.Common.Entities;

namespace Adashop.Entities;

public class ProductSpec : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // General
    public string? Brand { get; set; }
    public string? Model { get; set; }

    // Display
    public string? DisplaySize { get; set; }
    public string? DisplayType { get; set; }
    public string? DisplayResolution { get; set; }
    public string? RefreshRate { get; set; }

    // Performance
    public string? Processor { get; set; }
    public string? RAM { get; set; }
    public string? Storage { get; set; }
    public string? GPU { get; set; }
    public string? OperatingSystem { get; set; }

    // Camera (phones/tablets)
    public string? MainCamera { get; set; }
    public string? FrontCamera { get; set; }

    // Battery
    public string? BatteryCapacity { get; set; }
    public string? ChargingSpeed { get; set; }

    // Connectivity
    public string? Connectivity { get; set; }
    public string? Ports { get; set; }
    public string? Wireless { get; set; }

    // Physical
    public string? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? Color { get; set; }
    public string? Material { get; set; }

    // PC Components specific
    public string? VRAM { get; set; }
    public string? Cores { get; set; }
    public string? ClockSpeed { get; set; }
    public string? TDP { get; set; }
    public string? MemoryType { get; set; }
    public string? MemorySpeed { get; set; }
    public string? FormFactor { get; set; }
    public string? Socket { get; set; }

    // Source
    public string? SpecSource { get; set; } // "Icecat", "Manual"
    public DateTime? LastFetchedAt { get; set; }
}
