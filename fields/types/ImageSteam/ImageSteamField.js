import React, { PropTypes } from 'react';
import Field from '../Field';
import { Button, FormField, FormInput, FormNote } from 'elemental';
import FileChangeMessage from '../../components/FileChangeMessage';
import HiddenFileInput from '../../components/HiddenFileInput';
import ImageThumbnail from '../../components/ImageThumbnail';

// Generates a 5 char suffix, ie, 2hu0m
const generateSuffix = () => (0 | Math.random() * 9e6).toString(36);

const buildInitialState = props => ({
	action: null,
	removeExisting: false,
	uploadFieldPath: `${props.path}-${generateSuffix()}`,
	userSelectedFile: null,
});

module.exports = Field.create({
	propTypes: {
		autoCleanup: PropTypes.bool,
		collapse: PropTypes.bool,
		label: PropTypes.string,
		note: PropTypes.string,
		path: PropTypes.string.isRequired,
		value: PropTypes.shape({
			filename: PropTypes.string,
		// TODO: these are present but not used in the UI,
		//       should we start using them?
		// filetype: PropTypes.string,
		// originalname: PropTypes.string,
		// path: PropTypes.string,
		// size: PropTypes.number,
		}),
	},
	statics: {
		type: 'ImageSteam',
		getDefaultValue: () => ({}),
	},
	getInitialState () {
		return buildInitialState(this.props);
	},
	shouldCollapse () {
		return this.props.collapse && !this.hasExisting();
	},
	componentWillUpdate (nextProps) {
		// Show the new filename when it's finished uploading
		if (this.props.value && nextProps.value && (this.props.value.filename !== nextProps.value.filename)) {
			this.setState(buildInitialState(nextProps));
		}
	},

	// ==============================
	// HELPERS
	// ==============================

	hasFile () {
		return this.hasExisting() || !!this.state.userSelectedFile;
	},
	hasExisting () {
		return this.props.value && !!this.props.value.filename;
	},
	getFilename () {
		return this.state.userSelectedFile
		? this.state.userSelectedFile.name
		: this.props.value.filename;
	},

	getImageSource (height = null) {
		let mountPath = Keystone.imageSteam && Keystone.imageSteam.mountPath;
		let src;
		if (this.hasLocal()) {
			src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		} else if (this.hasExisting()) {
			src = `${mountPath}${this.props.value.path}/${this.props.value.filename}`;

			if (height) {
				src += `/:/rs=h:${height}`;
			}
		}

		return src;
	},

	hasLocal () {
		return !!this.state.userSelectedFile;
	},

	// ==============================
	// METHODS
	// ==============================

	triggerFileBrowser () {
		this.refs.fileInput.clickDomNode();
	},
	handleFileChange (event) {
		const userSelectedFile = event.target.files[0];

		this.setState({
			userSelectedFile,
		});
	},
	handleRemove (e) {
		let state = {};

		if (this.state.userSelectedFile) {
			state = buildInitialState(this.props);
		} else if (this.hasExisting()) {
			state.removeExisting = true;

			if (this.props.autoCleanup) {
				if (e.altKey) {
					state.action = 'reset';
				} else {
					state.action = 'delete';
				}
			} else {
		if (e.altKey) { // eslint-disable-line
			state.action = 'delete';
		} else {
			state.action = 'reset';
		}
			}
		}

		this.setState(state);
	},
	undoRemove () {
		this.setState(buildInitialState(this.props));
	},

	// ==============================
	// RENDERERS
	// ==============================

	renderImagePreview () {
		let mask;
		if (this.hasLocal()) mask = 'upload';
		else if (this.state.removeExisting) mask = 'remove';
	else if (this.state.loading) mask = 'loading';

		return (
			<ImageThumbnail
				component="a"
				href={this.getImageSource(null)}
				mask={mask}
				target="__blank"
				style={{ float: 'left', marginRight: '1em' }}
			>
				<img role="presentation" src={this.getImageSource(72)} style={{ height: 72 }} />
			</ImageThumbnail>
		);
	},

	renderFileNameAndChangeMessage () {
		const href = this.props.value ? this.props.value.url : undefined;
		return (
			<div>
			{(this.hasFile() && !this.state.removeExisting) ? (
				<FileChangeMessage href={href} target="_blank">
				{this.getFilename()}
				</FileChangeMessage>
			) : null}
			{this.renderChangeMessage()}
			</div>
		);
	},
	renderChangeMessage () {
		if (this.state.userSelectedFile) {
			return (
				<FileChangeMessage type="success">
					Image selected - save to upload
				</FileChangeMessage>
				);
		} else if (this.state.removeExisting) {
			return (
				<FileChangeMessage type="danger">
					Image {this.props.autoCleanup ? 'deleted' : 'removed'} - save to confirm
				</FileChangeMessage>
			);
		}

		return null;
	},
	renderClearButton () {
		if (this.state.removeExisting) {
			return (
				<Button type="link" onClick={this.undoRemove}>
					Undo Remove
				</Button>
			);
		}

		let clearText;
		if (this.state.userSelectedFile) {
			clearText = 'Cancel';
		} else {
			clearText = (this.props.autoCleanup ? 'Delete Image' : 'Remove Image');
		}

		return (
			<Button type="link-cancel" onClick={this.handleRemove}>
			{clearText}
			</Button>
		);
	},
	renderActionInput () {
	// If the user has selected a file for uploading, we need to point at
	// the upload field. If the file is being deleted, we submit that.
		if (this.state.userSelectedFile || this.state.action) {
			const value = this.state.userSelectedFile // eslint-disable-line no-nested-ternary
				? `upload:${this.state.uploadFieldPath}`
				: (this.state.action === 'delete' ? 'remove' : '');

			return (
				<input
					name={this.getInputName(this.props.path)}
					type="hidden"
					value={value}
				/>
			);
		}

		return null;
	},
	renderUI () {
		const buttons = (
			<div style={this.hasFile() ? { marginTop: '1em' } : null}>
				<Button onClick={this.triggerFileBrowser}>
				{this.hasFile() ? 'Change' : 'Upload'} Image
				</Button>
			{this.hasFile() && this.renderClearButton()}
			</div>
		);

		return (
			<div data-field-name={this.props.path} data-field-type="file">
				<FormField label={this.props.label} htmlFor={this.props.path}>
					{this.shouldRenderField() ? (
						<div>
							{this.hasFile() && this.renderImagePreview()}
							{this.hasFile() && this.renderFileNameAndChangeMessage()}
							{buttons}
							<HiddenFileInput
								key={this.state.uploadFieldPath}
								name={this.state.uploadFieldPath}
								onChange={this.handleFileChange}
								ref="fileInput" // eslint-disable-line react/no-string-refs
							/>
							{this.renderActionInput()}
						</div>
					) : (
						<div>
							{this.hasFile()
							? this.renderFileNameAndChangeMessage()
							: <FormInput noedit>no image</FormInput>}
						</div>
					)}
					{!!this.props.note && <FormNote note={this.props.note} />}
				</FormField>
			</div>
		);
	},

});
