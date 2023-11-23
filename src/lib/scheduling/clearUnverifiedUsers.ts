import { CronJob } from 'cron';
import { Op } from 'sequelize';
import User from '../../models/User';

const clearVerifications = new CronJob('0 1 * * *', async () => {
  try {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 1);

    await User.destroy({
      where: {
        isVerified: false,
        createdAt: { [Op.lt]: sixHoursAgo }
      }
    });
  } catch (error) {
    console.log(error);
  }
});

export default clearVerifications;