namespace OvenLogApi.Models;

public class Box
{
    public int Id { get; set; }
    public int TypeId { get; set; }
    public BoxType Type { get; set; } = null!;
    public int ManufacturerId { get; set; }
    public Manufacturer Manufacturer { get; set; } = null!;
    public int ModelId { get; set; }
    public Model Model { get; set; } = null!;
    public string ToolNumber { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;
    public int DefaultTemperature { get; set; }
    public int? WarmUpTimeMinutes { get; set; }
    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<OnEvent> OnEvents { get; set; } = new List<OnEvent>();
    public ICollection<UserOven> UserOvens { get; set; } = new List<UserOven>();
}
