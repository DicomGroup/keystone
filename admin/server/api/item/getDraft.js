module.exports = function (req, res) {
	if (req.list.getDraftModel) {
		var draftList = req.list.getDraftModel(req.list);

		if (!draftList) {
			return res.json({ hasDraft: false });
		}

		draftList.model.findById(req.params.id)
			.exec((err, item) => {
				if (err) {
					return res.json({ hasDraft: false, err });
				}

				res.json({ hasDraft: !!item, draft: item && item.id });
			});
	} else {
		res.json({ hasDraft: false });
	}
};
