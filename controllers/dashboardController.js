import Order from "../models/order.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import Supplier from "../models/supplier.js";
import { isAdmin } from "./userController.js";
import Rider from "../models/rider.js";


function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getTopCustomers(req, res) {
  try {
  
    const result = await Order.aggregate([
      {
        // group by the unique customer identifier
        $group: {
          _id: "$email",                 // or "$phone" or "$name" if that's unique
          name: { $first: "$name" },     // keep their display name
          orders: { $sum: 1 },
        },
      },
      { $match: { orders: { $gt: 3 } } }, // only customers with >3 orders
      { $sort: { orders: -1 } },
      {
        $project: {
          _id: 0,
          customer: "$name",
          orders: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error("getTopCustomers error", err);
    res.status(500).json({ message: err.message });
  }
}

export async function getUserRegistrations(req, res) {
  try {
   // if (!isAdmin(req)) {
     // return res.status(403).json({ message: "Only admins can view dashboard" });
   // }

    // query params: view = day | week | month
    const view = req.query.view || "day";
    const DAYS = 30; // default range
    const start = daysAgo(DAYS - 1);

    let groupStage = {};
    let projectKey = "";
    let format = "";

    if (view === "week") {
      groupStage = {
        y: { $year: "$date" },
        w: { $isoWeek: "$date" },
      };
      projectKey = {
        $dateFromParts: { isoWeekYear: "$_id.y", isoWeek: "$_id.w" },
      };
      format = "%G-W%V";
    } else if (view === "month") {
      groupStage = {
        y: { $year: "$date" },
        m: { $month: "$date" },
      };
      projectKey = {
        $dateFromParts: { year: "$_id.y", month: "$_id.m", day: 1 },
      };
      format = "%Y-%m";
    } else {
      groupStage = {
        y: { $year: "$date" },
        m: { $month: "$date" },
        d: { $dayOfMonth: "$date" },
      };
      projectKey = {
        $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" },
      };
      format = "%Y-%m-%d";
    }

    const agg = await User.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: groupStage, count: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          label: {
            $dateToString: { format, date: projectKey },
          },
          count: 1,
        },
      },
      { $sort: { label: 1 } },
    ]);

    res.json(agg);
  } catch (err) {
    console.error("getUserRegistrations error", err);
    res.status(500).json({ message: err.message });
  }
}



export async function getOverview(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Only admins can view dashboard" });
    }

    const DAYS = 12;
    const start = daysAgo(DAYS - 1);
    const prevStart = daysAgo(DAYS * 2 - 1);
    const prevEnd = daysAgo(DAYS);
    const ACTIVE_ORDERS = { status: { $nin: ["cancelled"] } };

    const [
      totalCustomers,
      totalOrders,
      totalRevenueAgg,
      totalReturns,
      totalRiders,
      totalSupplyCostAgg
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Order.countDocuments(ACTIVE_ORDERS),
      Order.aggregate([
        { $match: ACTIVE_ORDERS },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Order.countDocuments({ status: "returned" }),
      Rider.countDocuments({}),
      Supplier.aggregate([
        { $group: { _id: null, supplyCost: { $sum: "$cost" } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg?.[0]?.revenue || 0;
    const totalSupplyCost = totalSupplyCostAgg?.[0]?.supplyCost || 0;

    const [[prevOrdersAgg], [prevRevenueAgg]] = await Promise.all([
      Order.aggregate([
        { $match: { ...ACTIVE_ORDERS, date: { $gte: prevStart, $lt: prevEnd } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...ACTIVE_ORDERS, date: { $gte: prevStart, $lt: prevEnd } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
    ]);

    const currOrdersAgg = await Order.aggregate([
      { $match: { ...ACTIVE_ORDERS, date: { $gte: start } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const currRevenueAgg = await Order.aggregate([
      { $match: { ...ACTIVE_ORDERS, date: { $gte: start } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);

    const pct = (c, p) => (p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100);

    const kpis = {
      totalCustomers,
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      totalReturns,
      totalRiders,
      totalProfit: Math.round(totalRevenue - totalSupplyCost),
      totalSupplyCost: Math.round(totalSupplyCost),
      deltaCustomers: 0,
      deltaOrders: pct(currOrdersAgg?.[0]?.count || 0, prevOrdersAgg?.count || 0),
      deltaRevenue: pct(currRevenueAgg?.[0]?.revenue || 0, prevRevenueAgg?.revenue || 0),
      deltaReturns: 0,
    };

   
    const seriesAgg = await Order.aggregate([
      { $match: { ...ACTIVE_ORDERS, date: { $gte: start } } },
      {
        $group: {
          _id: {
            y: { $year: "$date" },
            m: { $month: "$date" },
            d: { $dayOfMonth: "$date" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          dayKey: {
            $dateToString: {
              date: { $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" } },
              format: "%Y-%m-%d",
            },
          },
          revenue: 1,
          orders: 1,
        },
      },
      { $sort: { dayKey: 1 } },
    ]);

    const days = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const dt = daysAgo(i);
      const key = dt.toISOString().slice(0, 10);
      const found = seriesAgg.find(x => x.dayKey === key);
      days.push({
        day: dt.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        revenue: Math.round(found?.revenue || 0),
        orders: found?.orders || 0,
      });
    }

    const catAgg = await Order.aggregate([
      { $match: ACTIVE_ORDERS },
      { $unwind: "$products" },
      {
        $addFields: {
          itemRevenue: {
            $multiply: ["$products.quantity", "$products.productInfo.price"],
          },
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "products.productInfo.productId",
          foreignField: "productId",
          as: "prod",
        },
      },
      { $unwind: { path: "$prod", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$prod.categories", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$prod.categories", "Uncategorized"] },
          amount: { $sum: "$itemRevenue" },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 10 },
    ]);

    const catTotal = catAgg.reduce((s, x) => s + x.amount, 0) || 1;
    const category = catAgg.map(x => ({
      category: x._id,
      amount: Math.round(x.amount),
      percent: Math.round((x.amount / catTotal) * 100),
    }));

    return res.json({
      kpis,
      series: days,
      category
    });
  } catch (err) {
    console.error("dashboard getOverview error", err);
    return res.status(500).json({ message: "Failed to build dashboard", error: err.message });
  }
}


export async function getTopProducts(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Only admins can view dashboard" });
    }

    const topProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productInfo.name",
          revenue: {
            $sum: { $multiply: ["$products.quantity", "$products.productInfo.price"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: "$_id", revenue: { $round: ["$revenue", 0] } } },
    ]);

    res.json(topProducts);
  } catch (err) {
    console.error("dashboard getTopProducts error", err);
    res.status(500).json({ message: "Failed to fetch top products", error: err.message });
  }
}
