namespace OvenLogApi.DTOs;

public class ApplicationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? DefaultBakeTimeMinutes { get; set; }
}

public class CreateApplicationDto
{
    public string Name { get; set; } = string.Empty;
    public int? DefaultBakeTimeMinutes { get; set; }
}
