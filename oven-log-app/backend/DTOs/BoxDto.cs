namespace OvenLogApi.DTOs;

public class BoxDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string ToolNumber { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int DefaultTemperature { get; set; }
    public int? WarmUpTimeMinutes { get; set; }
}

public class CreateBoxDto
{
    public int TypeId { get; set; }
    public int ManufacturerId { get; set; }
    public int ModelId { get; set; }
    public string ToolNumber { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public int DefaultTemperature { get; set; }
    public int? WarmUpTimeMinutes { get; set; }
}
