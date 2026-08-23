// Deprecated: Resume Upload feature has been removed.
export const uploadResumeMiddleware = (req, res, next) => next();
export const uploadAndParseResume = (req, res) => res.status(410).json({ message: "Resume Upload feature has been removed." });
export const confirmAutoPopulate = (req, res) => res.status(410).json({ message: "Resume Upload feature has been removed." });
