import React, { Component } from 'react';

import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';

class ImageSteamColumn extends Component {
	renderValue () {
		const value = this.props.data.fields[this.props.col.path];
		if (!value || !value.filename) return undefined;
		return value.filename;
	}

	render () {
		const value = this.props.data.fields[this.props.col.path];
		const href = value && value.url ? value.url : null;
		const label = value && value.filename ? value.filename : null;
		return (
			<ItemsTableCell href={href} padded interior field={this.props.col.type}>
				<ItemsTableValue>{label}</ItemsTableValue>
			</ItemsTableCell>
		);
	}
}

module.exports = ImageSteamColumn;
