namespace OvenLogApi.DTOs;

public class TrakDto
{
    public int Id { get; set; }
    public string TrakId { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? WorkOrder { get; set; }
    public int Quantity { get; set; }
    public bool IsActive { get; set; }
}

public class CreateTrakDto
{
    public string TrakId { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? WorkOrder { get; set; }
    public int Quantity { get; set; }
}
