namespace OvenLogApi.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? BadgeNumber { get; set; }
    public int? AssignedBoxId { get; set; }
}

public class CreateUserDto
{
    public string Login { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? BadgeNumber { get; set; }
    public int? AssignedBoxId { get; set; }
}
