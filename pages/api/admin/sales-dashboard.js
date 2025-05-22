import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { db } = await connectToDatabase();

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(new Date().setDate(todayStart.getDate() -1));
    yesterdayStart.setHours(0,0,0,0);

    const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Helper function to aggregate sales and count
    const getSalesData = async (startDate, endDate) => {
      const pipeline = [
        {
          $match: {
            status: 'SUCCESS',
            createdAt: {
              $gte: startDate,
              $lt: endDate ? endDate : new Date() // If no endDate, count up to now
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ];
      const result = await db.collection('transactions').aggregate(pipeline).toArray();
      return result.length > 0 ? { total: result[0].totalSales, count: result[0].count } : { total: 0, count: 0 };
    };
    
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    todayEnd.setHours(0,0,0,0);

    const salesToday = await getSalesData(todayStart, todayEnd);
    const salesLast7Days = await getSalesData(sevenDaysAgo, todayEnd); 
    const salesLast30Days = await getSalesData(thirtyDaysAgo, todayEnd);

    res.status(200).json({
      today: salesToday,
      last7Days: salesLast7Days,
      last30Days: salesLast30Days,
    });

  } catch (error) {
    console.error("[API Sales Dashboard] Error fetching sales data:", error);
    res.status(500).json({ error: true, message: 'Gagal mengambil data dashboard penjualan.', details: error.message });
  }
} 