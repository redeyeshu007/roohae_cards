import type { FilterQuery } from 'mongoose';
import { UserModel, type UserDoc, type UserDocument } from './user.model';
import type { PageParams } from '../../lib/http';

export class UserRepository {
  findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  findByEmail(email: string, withSecrets = false): Promise<UserDocument | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (withSecrets) query.select('+passwordHash +tokenVersion');
    return query.exec();
  }

  findByIdWithSecrets(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).select('+passwordHash +tokenVersion').exec();
  }

  create(data: Pick<UserDoc, 'name' | 'email' | 'passwordHash' | 'role'>): Promise<UserDocument> {
    return UserModel.create(data);
  }

  async paginate(params: PageParams, filter: FilterQuery<UserDoc> = {}) {
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      UserModel.find(filter).sort(params.sort).skip(params.skip).limit(params.limit).exec(),
      UserModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

export const userRepository = new UserRepository();
