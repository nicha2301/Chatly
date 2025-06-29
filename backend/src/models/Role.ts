import mongoose, { Schema, Document } from 'mongoose';

// Role permissions
export enum Permission {
  READ_MESSAGES = 'read:messages',
  WRITE_MESSAGES = 'write:messages',
  DELETE_MESSAGES = 'delete:messages',
  CREATE_GROUP = 'create:group',
  MANAGE_MEMBERS = 'manage:members',
  DELETE_CONVERSATION = 'delete:conversation',
}

// Role types
export enum RoleType {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

// Role interface
export interface IRole extends Document {
  name: string;
  permissions: Permission[];
  description?: string;
}

// Role schema
const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(RoleType)
    },
    permissions: [{
      type: String,
      enum: Object.values(Permission)
    }],
    description: {
      type: String
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model<IRole>('Role', RoleSchema);

// Create default roles if not exist
export const createDefaultRoles = async (): Promise<void> => {
  const Role = mongoose.model<IRole>('Role', RoleSchema);
  const count = await Role.countDocuments();
  
  if (count === 0) {
    const roles = [
      {
        name: RoleType.USER,
        permissions: [
          Permission.READ_MESSAGES, 
          Permission.WRITE_MESSAGES
        ],
        description: 'Regular user role'
      },
      {
        name: RoleType.MODERATOR,
        permissions: [
          Permission.READ_MESSAGES, 
          Permission.WRITE_MESSAGES, 
          Permission.DELETE_MESSAGES,
          Permission.MANAGE_MEMBERS
        ],
        description: 'Moderator role'
      },
      {
        name: RoleType.ADMIN,
        permissions: [
          Permission.READ_MESSAGES, 
          Permission.WRITE_MESSAGES, 
          Permission.DELETE_MESSAGES,
          Permission.CREATE_GROUP,
          Permission.MANAGE_MEMBERS,
          Permission.DELETE_CONVERSATION
        ],
        description: 'Administrator role'
      }
    ];
    
    await Role.insertMany(roles);
    console.log('Default roles created');
  }
}; 