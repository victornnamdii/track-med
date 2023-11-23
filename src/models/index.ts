import User from './User';
import { Medication } from './Medication';
import Reminder from './Reminder';

User.hasMany(Medication);
User.hasMany(Reminder);

Medication.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Medication.hasMany(Reminder);

Reminder.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Reminder.belongsTo(Medication, {
  foreignKey: 'medicationId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
