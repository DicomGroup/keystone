/* eslint-disable react/jsx-no-bind */

import assign from 'object-assign';
import { css } from 'glamor';
import React from 'react';
import Field from '../Field';
import Domify from 'react-domify';

import { Fields } from 'FieldTypes';
import { Button, GlyphButton } from '../../../admin/client/App/elemental';
import InvalidFieldType from '../../../admin/client/App/shared/InvalidFieldType';

let i = 0;
function generateId () {
	return i++;
};

const ItemDom = ({ name, id, index, max, onRemove, onMoveUp, onMoveDown, children }) => (
	<div style={{
		borderBottom: '1px solid #f9b26e',
		paddingTop: 15,
	}}>
		{name && <input type="hidden" name={name} value={id}/>}
		{children}
		<div style={{ textAlign: 'right', paddingBottom: 10 }}>
			{ index > 0 && (
			<Button size="xsmall" color="default" onClick={onMoveUp}>
				Move Up
			</Button>
			)}&nbsp;
			{ index < max - 1 && (
			<Button size="xsmall" color="default" onClick={onMoveDown}>
				Move Down
			</Button>
			)}&nbsp;
			<Button size="xsmall" color="danger" onClick={onRemove}>
				Remove
			</Button>
		</div>
	</div>
);

module.exports = Field.create({
	displayName: 'ListField',
	statics: {
		type: 'List',
	},
	propTypes: {
		fields: React.PropTypes.object.isRequired,
		label: React.PropTypes.string,
		onChange: React.PropTypes.func.isRequired,
		path: React.PropTypes.string.isRequired,
		value: React.PropTypes.array,
	},
	addItem () {
		const { path, value = [], onChange } = this.props;
		onChange({
			path,
			value: [
				...value,
				{
					id: generateId(),
					_isNew: true,
				},
			],
		});
	},
	removeItem (index) {
		const { value: oldValue, path, onChange } = this.props;
		const value = oldValue.slice(0, index).concat(oldValue.slice(index + 1));
		onChange({ path, value });
	},
	handleMoveUp (index) {
		const { value: oldValue, path, onChange } = this.props;
		const value = oldValue.slice(0);
		value.splice(index - 1, 0, value.splice(index, 1)[0])
		onChange({ path, value });
	},
	handleMoveDown (index) {
		const { value: oldValue, path, onChange } = this.props;
		const value = oldValue.slice(0);
		value.splice(index + 1, 0, value.splice(index, 1)[0])
		onChange({ path, value });
	},
	handleFieldChange (index, event) {
		const { value: oldValue, path, onChange } = this.props;
		const head = oldValue.slice(0, index);
		const item = {
			...oldValue[index],
			[event.path]: event.value,
		};
		const tail = oldValue.slice(index + 1);
		const value = [...head, item, ...tail];
		onChange({ path, value });
	},
	renderFieldsForItem (index, value) {
		return Object.keys(this.props.fields).map((path) => {
			const field = this.props.fields[path];
			if (typeof Fields[field.type] !== 'function') {
				return React.createElement(InvalidFieldType, { type: field.type, path: field.path, key: field.path });
			}
			const props = assign({}, field);
			props.value = value[field.path];
			props.values = value;
			props.onChange = this.handleFieldChange.bind(this, index);
			props.mode = 'edit';
      // Set the current prefix to <path of current list> + index.
      props.inputNamePrefix = `${this.props.inputNamePrefix || this.props.path}[${index}]`;
			props.key = field.path;
			// TODO ?
			// if (props.dependsOn) {
			// 	props.currentDependencies = {};
			// 	Object.keys(props.dependsOn).forEach(dep => {
			// 		props.currentDependencies[dep] = this.state.values[dep];
			// 	});
			// }
			return React.createElement(Fields[field.type], props);
		}, this);
	},
	renderItems () {
		const { value = [], path, inputNamePrefix } = this.props;
    // Initialize inputNamePrefix for this list.
    this.props.inputNamePrefix = ((a, b) => a ?`${a}[${b}]`:b)(inputNamePrefix, path);
		const onAdd = this.addItem;
		const max = value.length;
		return (
			<div>
				{value.map((value, index) => {
					const { id, _isNew } = value;
					const name = !_isNew && `${path}[${index}][id]`;
					const onRemove = e => this.removeItem(index);
					const onMoveUp = e => this.handleMoveUp(index);
					const onMoveDown = e => this.handleMoveDown(index);

					return (
						<ItemDom key={id} {...{ id, name, onRemove, onMoveUp, onMoveDown, index, max }}>
							{this.renderFieldsForItem(index, value)}
						</ItemDom>
					);
				})}
				<GlyphButton color="success" glyph="plus" position="left" onClick={onAdd} style={{marginTop: '15px'}}>
					Add
				</GlyphButton>
			</div>
		);
	},
	renderUI () {
		const { label, value } = this.props;
		return (
			<div className={css(classes.container)}>
				{this.shouldRenderField() ? (
					this.renderItems()
				) : (
					<Domify value={value} />
				)}
				{this.renderNote()}
			</div>
		);
	},
});

const classes = {
	container: {
		marginTop: '0em',
		marginBottom: '2em',
	},
};
