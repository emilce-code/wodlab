import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  AthleteInsightsPeriod,
  FindAthleteInsightsQueryDto,
} from './find-athlete-insights-query.dto';

describe('FindAthleteInsightsQueryDto', () => {
  it('applies the default period and timezone', async () => {
    const query = plainToInstance(FindAthleteInsightsQueryDto, {});

    await expect(validate(query)).resolves.toEqual([]);
    expect(query.period).toBe(AthleteInsightsPeriod.NINETY_DAYS);
    expect(query.timeZone).toBe('UTC');
  });

  it.each(Object.values(AthleteInsightsPeriod))(
    'accepts the %s period',
    async (period) => {
      const query = plainToInstance(FindAthleteInsightsQueryDto, {
        period,
        timeZone: 'America/Asuncion',
      });

      await expect(validate(query)).resolves.toEqual([]);
    },
  );

  it('rejects unsupported periods', async () => {
    const query = plainToInstance(FindAthleteInsightsQueryDto, {
      period: '7D',
    });

    const errors = await validate(query);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('period');
  });

  it('rejects invalid IANA timezones', async () => {
    const query = plainToInstance(FindAthleteInsightsQueryDto, {
      timeZone: 'Asuncion',
    });

    const errors = await validate(query);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('timeZone');
  });
});
