import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateBoxDto } from './update-box.dto';
import { CreateBoxDto } from './create-box.dto';

describe('Box Details contact validation', () => {
  it('accepts optional, cleared and legacy data', async () => {
    expect(
      await validate(
        plainToInstance(UpdateBoxDto, {
          description: '',
          address: null,
          whatsapp: '',
          phone: null,
          email: null,
          instagram: null,
          website: null,
          supportContact: 'Ask at reception\nEvenings only',
        }),
      ),
    ).toEqual([]);
    expect(
      await validate(plainToInstance(CreateBoxDto, { name: 'Box' })),
    ).toEqual([]);
  });
  it('normalizes international phone numbers and trims fields', async () => {
    const dto = plainToInstance(UpdateBoxDto, {
      whatsapp: '+595 (981) 123-456',
      phone: '+55 11 98765-4321',
      email: ' hello@example.com ',
      name: ' North Box ',
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({
      whatsapp: '+595981123456',
      phone: '+5511987654321',
      email: 'hello@example.com',
      name: 'North Box',
    });
  });
  it.each([
    { whatsapp: 'javascript:alert(1)' },
    { phone: '555' },
    { email: 'bad' },
    { instagram: 'https://evil.example/instagram.com/owner' },
    { website: 'javascript:alert(1)' },
    { website: 'https://user:secret@example.com' },
    { latitude: 91 },
    { longitude: -181 },
    { timezone: 'Mars/Box' },
    { name: '  ' },
  ])('rejects malformed values: %j', async (data) => {
    expect(
      (await validate(plainToInstance(UpdateBoxDto, data))).length,
    ).toBeGreaterThan(0);
  });
});
