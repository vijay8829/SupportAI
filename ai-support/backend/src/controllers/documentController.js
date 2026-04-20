const Document = require('../models/Document');
const Company = require('../models/Company');
const { deleteChunksByDocument } = require('../services/vectorService');
const { processDocument } = require('../services/documentProcessorService');

exports.listDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { company: req.company._id };
    if (status) filter.status = status;

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Document.countDocuments(filter),
    ]);

    res.json({
      documents,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file && !req.body.content) {
      return res.status(400).json({ error: 'No file or content provided' });
    }

    const { name, type = 'text', description } = req.body;
    const docType = req.file
      ? (req.file.mimetype === 'application/pdf' ? 'pdf' : type)
      : type;

    const docName = name || req.file?.originalname || 'Untitled Document';

    const document = await Document.create({
      company: req.company._id,
      name: docName,
      type: docType,
      originalName: req.file?.originalname,
      fileSize: req.file?.size,
      description,
      uploadedBy: req.user._id,
      status: 'processing',
    });

    await Company.findByIdAndUpdate(req.company._id, {
      $inc: { documentsCount: 1 },
    });

    // Respond immediately, process async
    res.status(202).json({
      message: 'Document uploaded and processing started',
      document: { id: document._id, name: docName, status: 'processing' },
    });

    // Process in background
    // With disk storage req.file.buffer is undefined — use filePath instead.
    // For inline text content, convert to buffer directly.
    const isFileUpload = !!req.file;
    processDocument({
      documentId: document._id,
      companyId: req.company._id,
      buffer:   isFileUpload ? null : Buffer.from(req.body.content, 'utf-8'),
      filePath: isFileUpload ? req.file.path : null,
      mimetype: req.file?.mimetype,
      docType,
      documentName: docName,
    }).catch(err => console.error('[Upload] Processing error:', err.message));

  } catch (error) {
    next(error);
  }
};

exports.getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company: req.company._id })
      .populate('uploadedBy', 'name email');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company: req.company._id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await Promise.all([
      Document.findByIdAndDelete(doc._id),
      deleteChunksByDocument(doc._id),
      Company.findByIdAndUpdate(req.company._id, { $inc: { documentsCount: -1 } }),
    ]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.reprocessDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company: req.company._id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!req.file && !req.body.content) {
      return res.status(400).json({ error: 'No content provided for reprocessing' });
    }

    res.json({ message: 'Reprocessing started', documentId: doc._id });

    const isFileUpload = !!req.file;
    processDocument({
      documentId: doc._id,
      companyId: req.company._id,
      buffer:   isFileUpload ? null : Buffer.from(req.body.content, 'utf-8'),
      filePath: isFileUpload ? req.file.path : null,
      mimetype: req.file?.mimetype,
      docType: doc.type,
      documentName: doc.name,
    }).catch(err => console.error('[Reprocess] Error:', err.message));
  } catch (error) {
    next(error);
  }
};
