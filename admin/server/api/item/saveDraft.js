module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}

	var draftsList = req.list.getDraftModel(req.list);

	draftsList.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });

		const doUpdate = (updateItem) => {
			draftsList.updateItem(updateItem, req.body, { ignoreNoEdit: true, files: req.files || [] }, function (err) {
				if (err) {
					var status = err.error === 'validation errors' ? 400 : 500;
					var error = err.error === 'database error' ? err.detail : err;
					return res.apiError(status, error);
				}

				// Reload the item from the database to prevent save hooks or other
				// application specific logic from messing with the values in the item
				draftsList.model.findById(req.params.id, function (err, updatedItem) {
					res.json(draftsList.getData(updatedItem));
				});
			});
		};

		const cloneIt = () => {
			// need to clone
			req.list.model.findById(req.params.id).exec(function (err, original) {
				if (err || !original) {
					return res.json({ err, original });
				}

				const cloned = original.toObject();
				var updateItem = new draftsList.model(cloned);

				updateItem.save(() => doUpdate(updateItem));
			});
		};

		if (item) {
			item.remove(function (err) {
				cloneIt();
			});
		} else {
			cloneIt();
		}
	});
};
