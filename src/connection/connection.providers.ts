import * as mongoose from 'mongoose';

export const connectionProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb://localhost/gallery'),
  },
];
