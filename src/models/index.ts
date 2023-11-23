import User from './User';
import { Medication } from './Medication';
import Reminder from './Reminder';

User.hasMany(Medication);
User.hasMany(Reminder);

Medication.belongsTo(User, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Medication.hasMany(Reminder);

Reminder.belongsTo(User, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Reminder.belongsTo(Medication, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
