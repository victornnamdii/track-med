import User from './User';
import Medication from './Medication';

User.hasMany(Medication);
Medication.belongsTo(User, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
