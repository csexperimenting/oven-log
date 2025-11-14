using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;
using OvenLogApi.DTOs;
using OvenLogApi.Models;

namespace OvenLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly OvenLogContext _context;

    public UsersController(OvenLogContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Login = u.Login,
                Email = u.Email,
                Name = u.Name,
                BadgeNumber = u.BadgeNumber,
                AssignedBoxId = u.AssignedBoxId
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var dto = new UserDto
        {
            Id = user.Id,
            Login = user.Login,
            Email = user.Email,
            Name = user.Name,
            BadgeNumber = user.BadgeNumber,
            AssignedBoxId = user.AssignedBoxId
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
    {
        var user = new User
        {
            Login = dto.Login,
            Email = dto.Email,
            Name = dto.Name,
            BadgeNumber = dto.BadgeNumber,
            AssignedBoxId = dto.AssignedBoxId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var result = new UserDto
        {
            Id = user.Id,
            Login = user.Login,
            Email = user.Email,
            Name = user.Name,
            BadgeNumber = user.BadgeNumber,
            AssignedBoxId = user.AssignedBoxId
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, CreateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        user.Login = dto.Login;
        user.Email = dto.Email;
        user.Name = dto.Name;
        user.BadgeNumber = dto.BadgeNumber;
        user.AssignedBoxId = dto.AssignedBoxId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
