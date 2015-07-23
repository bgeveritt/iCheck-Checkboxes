# CheckboxSetSelector

This widget lets you use a list of checkboxes for your Reference Set, plain and simple.

## Description
 
This widget lets you use a list of checkboxes for your Reference Set, plain and simple. It supports multiple display attributes and looks the same as the Reference Set Selector.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario
 
Quickly setting/adjusting a reference set, without having to go through popups and buttons.
Showing multiple attributes of the objects for the Reference Set.
 
## Features and limitations
 
- Show multiple display attributes.
- Show display attributes over 1-deep association
- Does not support dynamic sorting by clicking on the headers
- On change microflow only receives context object.
- No paging.

## Configuration
 
Insert the widget into your dataview and set the properties.
 
## Properties
 
- Appearance
  - Use headers: Boolean to enable/disable the headers.
  - Checkbox column width value: The value of the width.
  - Checkbox column width unit: The unit of the width this could be pixels, percentages or any other typographic width unit in the list. Be sure to test in serveral browsers.
- Display attributes
  - Width: The width of the column for this display attribute in pixels or percentage.
  - Currency type: This lets you display the attribute as a currency. Leave on none if not applicable.
  - Group separators: Boolean to use group separators if displayed as currency.
  - Header text: The text used for the header of the column. Required but only shown if 'Use headers' is set to true.
  - Attribute: The attribute that is to be shown.
- Behavior
  - On change: The microflow to call after a checkbox is clicked. The microflow only receives the context object.
  - Listen source: The channel to broadcast the clicked object on. This can then be received by the Form Loader on the same channel, which will load the form with the object.
  - Begin empty: The listen will automatically fill the form loader with the first object retrieved. Set this to true to disable this and have the formloader start off empty.
Add 'Select All' checkbox: If true, a checkbox will be added in the header row to check or uncheck all (default true)
- Data source
  - Association: The reference set association, starting from the dataview object.
  - Sort attribute: The attribute to sort the list on
  - Sort order: The order the list should be sorted in.
  - XPath Constraint: An XPath constraint on the possible objects that are shown. Do note that a reference set can contain objects not shown because of this constraint if set elsewhere.
  - Limit: A limit to the number of objects shown to prevent the widget from becoming too large. Leave on 0 for unlimited.
