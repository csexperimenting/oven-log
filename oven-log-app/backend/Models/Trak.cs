namespace OvenLogApi.Models;

public class Trak
{
    public int Id { get; set; }
    public string TrakId { get; set; } = string.Empty;
    public int PartId { get; set; }
    public Part Part { get; set; } = null!;
    public string? SerialNumber { get; set; }
    public string? WorkOrder { get; set; }
    public int Quantity { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Event> Events { get; set; } = new List<Event>();
}
