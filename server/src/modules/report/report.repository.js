import Report from '../../models/Report.js';

const createReport = payload => Report.create(payload);

const findReportById = id => Report.findById(id);

const findReportByIdLean = id => Report.findById(id).lean();

const findReports = (query, options = {}) => {
  return Report.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { priority: -1, createdAt: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const countReports = query => Report.countDocuments(query);

const updateReportById = (id, update, options = {}) => {
  return Report.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteReport = id => Report.findByIdAndDelete(id);

export default {
  createReport,
  findReportById,
  findReportByIdLean,
  findReports,
  countReports,
  updateReportById,
  deleteReport,
};
