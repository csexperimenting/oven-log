namespace OvenLogApi.DTOs;

public class EventDto
{
    public int Id { get; set; }
    public string TrakId { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public int BoxId { get; set; }
    public string BoxName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string UserBadge { get; set; } = string.Empty;
    public string? ApplicationName { get; set; }
    public int Temperature { get; set; }
    public int Quantity { get; set; }
    public DateTime OvenInTime { get; set; }
    public DateTime? OvenOutTime { get; set; }
    public int PlannedBakeTimeMinutes { get; set; }
    public int? ActualBakeTimeMinutes { get; set; }
    public int? TimeRemainingMinutes { get; set; }
    public string? Notes { get; set; }
}

public class CreateEventDto
{
    public string TrakId { get; set; } = string.Empty;
    public int BoxId { get; set; }
    public int? ApplicationId { get; set; }
    public int Temperature { get; set; }
    public int Quantity { get; set; }
    public DateTime? OvenInTime { get; set; }
    public int PlannedBakeTimeMinutes { get; set; }
    public string? Notes { get; set; }
}

public class BatchCreateEventDto
{
    public List<string> TrakIds { get; set; } = new();
    public int BoxId { get; set; }
    public int? ApplicationId { get; set; }
    public int Temperature { get; set; }
    public int Quantity { get; set; }
    public DateTime? OvenInTime { get; set; }
    public int PlannedBakeTimeMinutes { get; set; }
    public string? Notes { get; set; }
}
