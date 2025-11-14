using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;
using OvenLogApi.DTOs;
using OvenLogApi.Models;

namespace OvenLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TraksController : ControllerBase
{
    private readonly OvenLogContext _context;

    public TraksController(OvenLogContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TrakDto>>> GetTraks()
    {
        var traks = await _context.Traks
            .Include(t => t.Part)
            .Where(t => t.IsActive)
            .Select(t => new TrakDto
            {
                Id = t.Id,
                TrakId = t.TrakId,
                PartNumber = t.Part.PartNumber,
                SerialNumber = t.SerialNumber,
                WorkOrder = t.WorkOrder,
                Quantity = t.Quantity,
                IsActive = t.IsActive
            })
            .ToListAsync();

        return Ok(traks);
    }

    [HttpGet("{trakId}")]
    public async Task<ActionResult<TrakDto>> GetTrak(string trakId)
    {
        var trak = await _context.Traks
            .Include(t => t.Part)
            .FirstOrDefaultAsync(t => t.TrakId == trakId);

        if (trak == null)
        {
            return NotFound();
        }

        var dto = new TrakDto
        {
            Id = trak.Id,
            TrakId = trak.TrakId,
            PartNumber = trak.Part.PartNumber,
            SerialNumber = trak.SerialNumber,
            WorkOrder = trak.WorkOrder,
            Quantity = trak.Quantity,
            IsActive = trak.IsActive
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<TrakDto>> CreateTrak(CreateTrakDto dto)
    {
        var existingTrak = await _context.Traks.FirstOrDefaultAsync(t => t.TrakId == dto.TrakId);
        if (existingTrak != null)
        {
            return Conflict("TRAK already exists");
        }

        var part = await _context.Parts.FirstOrDefaultAsync(p => p.PartNumber == dto.PartNumber);
        if (part == null)
        {
            part = new Part { PartNumber = dto.PartNumber };
            _context.Parts.Add(part);
            await _context.SaveChangesAsync();
        }

        var trak = new Trak
        {
            TrakId = dto.TrakId,
            PartId = part.Id,
            SerialNumber = dto.SerialNumber,
            WorkOrder = dto.WorkOrder,
            Quantity = dto.Quantity,
            IsActive = true
        };

        _context.Traks.Add(trak);
        await _context.SaveChangesAsync();

        var result = new TrakDto
        {
            Id = trak.Id,
            TrakId = trak.TrakId,
            PartNumber = part.PartNumber,
            SerialNumber = trak.SerialNumber,
            WorkOrder = trak.WorkOrder,
            Quantity = trak.Quantity,
            IsActive = trak.IsActive
        };

        return CreatedAtAction(nameof(GetTrak), new { trakId = trak.TrakId }, result);
    }

    [HttpGet("{trakId}/history")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetTrakHistory(string trakId)
    {
        var trak = await _context.Traks.FirstOrDefaultAsync(t => t.TrakId == trakId);
        if (trak == null)
        {
            return NotFound();
        }

        var events = await _context.Events
            .Include(e => e.Trak).ThenInclude(t => t.Part)
            .Include(e => e.Box).ThenInclude(b => b.Location)
            .Include(e => e.User)
            .Include(e => e.Application)
            .Where(e => e.TrakId == trak.Id)
            .OrderByDescending(e => e.OvenInTime)
            .Select(e => new EventDto
            {
                Id = e.Id,
                TrakId = e.Trak.TrakId,
                PartNumber = e.Trak.Part.PartNumber,
                SerialNumber = e.Trak.SerialNumber,
                BoxId = e.BoxId,
                BoxName = e.Box.ToolNumber,
                Location = e.Box.Location.Name,
                UserBadge = e.User.BadgeNumber ?? e.User.Login,
                ApplicationName = e.Application != null ? e.Application.Name : null,
                Temperature = e.Temperature,
                Quantity = e.Quantity,
                OvenInTime = e.OvenInTime,
                OvenOutTime = e.OvenOutTime,
                PlannedBakeTimeMinutes = e.PlannedBakeTimeMinutes,
                ActualBakeTimeMinutes = e.ActualBakeTimeMinutes,
                Notes = e.Notes
            })
            .ToListAsync();

        return Ok(events);
    }
}
