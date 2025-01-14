module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}

	const sendResponse = () => {
		req.list.model.findById(req.params.id, function (err, updatedItem) {
			res.json(req.list.getData(updatedItem));
		});
	};

	var doUpdate = (item, data, callback, files = req.files) => {
		req.list.updateItem(item, data, { files: files, user: req.user }, function (err) {
			if (err) {
				var status = err.error === 'validation errors' ? 400 : 500;
				var error = err.error === 'database error' ? err.detail : err;
				return res.apiError(status, error);
			}

			callback();
		});
	};

	req.list.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });
		if (!item) return res.status(404).json({ error: 'not found', id: req.params.id });

		// Does this list have drafts enabled? If so - is there a draft that needs updating first?
		if (req.list.getDraftModel) {
			var draftModel = req.list.getDraftModel(req.list);
			draftModel.model.findById(req.params.id)
				.exec((err, draft) => {
					if (!draft) {
						return doUpdate(item, req.body, sendResponse);
					}

					draft.remove();
					doUpdate(item, req.body, sendResponse);
				});
		} else {
			doUpdate(item, req.body, sendResponse);
		}
	});


};
