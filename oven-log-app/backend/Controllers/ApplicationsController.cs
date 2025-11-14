using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;
using OvenLogApi.DTOs;
using OvenLogApi.Models;

namespace OvenLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly OvenLogContext _context;

    public ApplicationsController(OvenLogContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApplicationDto>>> GetApplications()
    {
        var applications = await _context.Applications
            .Select(a => new ApplicationDto
            {
                Id = a.Id,
                Name = a.Name,
                DefaultBakeTimeMinutes = a.DefaultBakeTimeMinutes
            })
            .ToListAsync();

        return Ok(applications);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationDto>> GetApplication(int id)
    {
        var application = await _context.Applications.FindAsync(id);

        if (application == null)
        {
            return NotFound();
        }

        var dto = new ApplicationDto
        {
            Id = application.Id,
            Name = application.Name,
            DefaultBakeTimeMinutes = application.DefaultBakeTimeMinutes
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationDto>> CreateApplication(CreateApplicationDto dto)
    {
        var application = new Application
        {
            Name = dto.Name,
            DefaultBakeTimeMinutes = dto.DefaultBakeTimeMinutes
        };

        _context.Applications.Add(application);
        await _context.SaveChangesAsync();

        var result = new ApplicationDto
        {
            Id = application.Id,
            Name = application.Name,
            DefaultBakeTimeMinutes = application.DefaultBakeTimeMinutes
        };

        return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateApplication(int id, CreateApplicationDto dto)
    {
        var application = await _context.Applications.FindAsync(id);
        if (application == null)
        {
            return NotFound();
        }

        application.Name = dto.Name;
        application.DefaultBakeTimeMinutes = dto.DefaultBakeTimeMinutes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteApplication(int id)
    {
        var application = await _context.Applications.FindAsync(id);
        if (application == null)
        {
            return NotFound();
        }

        _context.Applications.Remove(application);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
