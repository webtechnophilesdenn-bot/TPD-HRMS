// controllers/contractController.js
const Contract = require("../models/Contract");
const SignatureRequest = require("../models/SignatureRequest");
const Employee = require("../models/Employee");
const { sendResponse } = require("../utils/responseHandler");

/**
 * Create a new contract record (metadata only; file URL should be provided by frontend
 * after upload to your storage like S3/Cloudinary).
 */
exports.createContract = async (req, res, next) => {
  try {
    const {
      title,
      contractType,
      employeeId,
      parties,
      file,
      effectiveDate,
      expiryDate,
      metadata,
      departmentId,
    } = req.body;

    let employee = null;
    if (employeeId) {
      employee = await Employee.findById(employeeId);
      if (!employee) {
        return sendResponse(res, 404, false, "Employee not found");
      }
    }

    const contract = new Contract({
      title,
      contractType,
      employee: employee ? employee._id : undefined,
      parties: parties || [],
      file: file || {},
      effectiveDate: effectiveDate || null,
      expiryDate: expiryDate || null,
      metadata: metadata || {},
      department: departmentId || undefined,
      owner: req.user?._id,
    });

    contract.addTimelineEntry("CREATED", req.user?._id, "Contract created");

    await contract.save();

    await contract.populate([
      { path: "employee", select: "firstName lastName employeeId department" },
      { path: "department", select: "name" },
    ]);

    sendResponse(res, 201, true, "Contract created successfully", {
      contract,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contracts with filters (for admin/HR)
 */
exports.getContracts = async (req, res, next) => {
  try {
    const {
      employeeId,
      contractType,
      status,
      departmentId,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isArchived: false };

    if (employeeId) {
      query.employee = employeeId;
    }
    if (contractType) {
      query.contractType = contractType;
    }
    if (status) {
      query.status = status;
    }
    if (departmentId) {
      query.department = departmentId;
    }

    const contracts = await Contract.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("department", "name")
      .populate("signatureRequest")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));

    const total = await Contract.countDocuments(query);

    sendResponse(res, 200, true, "Contracts fetched successfully", {
      contracts,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        totalRecords: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single contract by ID
 */
exports.getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id)
      .populate("employee", "firstName lastName employeeId department")
      .populate("department", "name")
      .populate("signatureRequest");

    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    sendResponse(res, 200, true, "Contract fetched successfully", {
      contract,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contract (metadata only; not status or signature)
 */
exports.updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    const updatableFields = [
      "title",
      "contractType",
      "parties",
      "file",
      "effectiveDate",
      "expiryDate",
      "metadata",
      "department",
    ];

    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        contract[field] = updates[field];
      }
    });

    contract.addTimelineEntry(
      "UPDATED",
      req.user?._id,
      updates.notes || "Contract updated"
    );

    await contract.save();

    sendResponse(res, 200, true, "Contract updated successfully", {
      contract,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive contract (soft delete)
 */
exports.archiveContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    contract.isArchived = true;
    contract.addTimelineEntry(
      "ARCHIVED",
      req.user?._id,
      "Contract archived from UI"
    );
    await contract.save();

    sendResponse(res, 200, true, "Contract archived successfully", {
      contract,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send contract for e-signature.
 *
 * This is a stub that simulates integration with an external e-sign provider.
 * Replace the "SIMULATED" provider logic with real calls to Zoho Sign / DocuSign / OpenSign.
 */
exports.sendForSignature = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { provider = "ZohoSign", subject, message, signers } = req.body;

    const contract = await Contract.findById(id).populate(
      "employee",
      "firstName lastName email"
    );
    if (!contract) {
      return sendResponse(res, 404, false, "Contract not found");
    }

    if (!contract.file?.url) {
      return sendResponse(
        res,
        400,
        false,
        "Contract file URL is required before sending for signature"
      );
    }

    const signerList = signers && signers.length
      ? signers
      : [
          {
            name: `${contract.employee?.firstName || ""} ${
              contract.employee?.lastName || ""
            }`.trim(),
            email: contract.employee?.email,
            role: "Employee",
            order: 1,
          },
        ];

    // TODO: integrate real provider here.
    // For now, simulate provider requestId and URLs.
    const fakeProviderRequestId = `SIM-${Date.now()}`;
    const fakeSigningUrl = `https://example-esign-provider.com/sign/${fakeProviderRequestId}`;

    const signatureRequest = new SignatureRequest({
      contract: contract._id,
      provider,
      providerRequestId: fakeProviderRequestId,
      status: "Sent",
      signers: signerList.map((s, idx) => ({
        name: s.name,
        email: s.email,
        role: s.role || "Other",
        order: s.order || idx + 1,
        status: "Sent",
      })),
      subject:
        subject || `Signature request for ${contract.title || "Contract"}`,
      message:
        message ||
        "Please review and sign this contract at your earliest convenience.",
      urls: {
        signingUrl: fakeSigningUrl,
      },
    });

    signatureRequest.addEvent("SENT", {
      by: req.user?._id,
      signingUrl: fakeSigningUrl,
    });

    await signatureRequest.save();

    contract.signatureRequest = signatureRequest._id;
    contract.status = "SentForSignature";
    contract.addTimelineEntry(
      "SENT_FOR_SIGNATURE",
      req.user?._id,
      `Sent via ${provider}`
    );
    await contract.save();

    sendResponse(res, 200, true, "Signature request created successfully", {
      contract,
      signatureRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook endpoint to update signature status from provider.
 * You’ll configure your e-sign provider to call this URL.
 *
 * For now, this just accepts a generic payload:
 * { providerRequestId, status, signedFileUrl, signers: [...] }
 */
exports.handleSignatureWebhook = async (req, res, next) => {
  try {
    const { providerRequestId, status, signedFileUrl, signers, provider } =
      req.body;

    if (!providerRequestId) {
      return sendResponse(
        res,
        400,
        false,
        "providerRequestId is required in webhook payload"
      );
    }

    const signatureRequest = await SignatureRequest.findOne({
      providerRequestId,
    }).populate("contract");

    if (!signatureRequest) {
      return sendResponse(res, 404, false, "Signature request not found");
    }

    if (status) {
      signatureRequest.status = status;
    }

    if (Array.isArray(signers) && signers.length > 0) {
      signers.forEach((incoming) => {
        const idx = signatureRequest.signers.findIndex(
          (s) => s.email === incoming.email
        );
        if (idx !== -1) {
          signatureRequest.signers[idx].status = incoming.status || "Signed";
          signatureRequest.signers[idx].signedAt =
            incoming.signedAt || new Date();
        }
      });
    }

    signatureRequest.addEvent("WEBHOOK", { payload: req.body });
    await signatureRequest.save();

    const contract = await Contract.findById(signatureRequest.contract);

    if (status === "Completed") {
      contract.status = "Signed";
      contract.signedDate = new Date();
      if (signedFileUrl) {
        contract.signedFile = {
          url: signedFileUrl,
          signedAt: new Date(),
          storageProvider: "other",
        };
      }
      contract.addTimelineEntry(
        "SIGNED",
        null,
        `Contract signed via ${provider || signatureRequest.provider}`
      );
    } else if (status === "Declined") {
      contract.status = "Declined";
      contract.addTimelineEntry(
        "DECLINED",
        null,
        "Contract was declined by signer"
      );
    } else if (status === "Expired") {
      contract.status = "Expired";
      contract.addTimelineEntry("EXPIRED", null, "Signature request expired");
    }

    await contract.save();

    // Provider usually expects 2xx quickly
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contracts for current logged-in employee (self-service view)
 */
exports.getMyContracts = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const contracts = await Contract.find({
      employee: employee._id,
      isArchived: false,
    })
      .populate("signatureRequest")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "My contracts fetched successfully", {
      contracts,
    });
  } catch (error) {
    next(error);
  }
};
