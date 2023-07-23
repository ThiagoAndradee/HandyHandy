"use strict";
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
// Function to convert a selected group into a frame with no fill properties
function convertToFrameWithNoFill() {
    // Assuming you have selected a group on the current page
    const selectedGroup = figma.currentPage.selection[0];
    // Check if the selected layer is a group
    if (selectedGroup && selectedGroup.type === "GROUP") {
        // Get the parent of the selected group
        const parent = selectedGroup.parent;
        // Get the position of the selected group
        const x = selectedGroup.x;
        const y = selectedGroup.y;
        // Create a new frame with the same size and position as the selected group
        const newFrame = figma.createFrame();
        newFrame.resize(selectedGroup.width, selectedGroup.height);
        newFrame.x = x;
        newFrame.y = y;
        // Copy the children layers from the selected group to the new frame
        for (const layer of selectedGroup.children) {
            const newLayer = layer.clone();
            newFrame.appendChild(newLayer);
        }
        // Set the fill properties of the new frame to none
        newFrame.fills = [];
        // Remove the now-empty group
        selectedGroup.remove();
        // Select the new frame
        figma.currentPage.selection = [newFrame];
    }
}
function GroupElements() {
    // Assuming you have selected some layers on the current page
    const selectedLayers = figma.currentPage.selection;
    console.log("selectedLayers", selectedLayers);
    // Get the parent layer where you want to group the selected layers
    const parent = figma.currentPage.findOne(node => node.name === "Group 1");
    // Check if the parent layer exists and it's a Frame or Group node
    if (parent && (parent.type === "FRAME" || parent.type === "GROUP")) {
        // Group the selected layers under the specified parent
        const groupedLayers = figma.group(selectedLayers, parent);
        // You can also adjust the position of the grouped layers if needed
        // For example, to move the group to a specific position:
        groupedLayers.x = 100;
        groupedLayers.y = 200;
    }
    else {
        // If the specified parent does not exist or is not a valid type,
        // you can group the selected layers at the root level of the page.
        const groupedLayers = figma.group(selectedLayers, figma.currentPage);
        figma.currentPage.selection = [groupedLayers];
    }
    // figma.group(figma.currentPage.selection,parent)
}
function ungroupElements() {
    // Assuming you have selected a group on the current page
    const selectedGroup = figma.currentPage.selection[0];
    // Check if the selected layer is a group
    if (selectedGroup && selectedGroup.type === "GROUP") {
        // Get the parent of the selected group
        const parent = selectedGroup.parent;
        // Loop through the layers in the group and move them out of the group
        for (const layer of selectedGroup.children) {
            // Reset the parent to the original parent (moving the layer out of the group)
            parent.appendChild(layer);
        }
    }
}
// Function to apply auto layout to the selected elements
function applyAutoLayout() {
    // Get the selected nodes
    const selectedNodes = figma.currentPage.selection;
    // Check if there are selected nodes
    if (selectedNodes.length === 0) {
        figma.notify("Please select one or more elements to apply auto layout.");
        return;
    }
    // Get the initial position of the selected nodes
    const initialX = selectedNodes[0].x;
    const initialY = selectedNodes[0].y;
    // Apply auto layout with horizontal direction and spacing of 16 pixels
    const layoutGrid = figma.createFrame();
    layoutGrid.layoutMode = "HORIZONTAL";
    layoutGrid.itemSpacing = 16;
    // Move the selected nodes into the layout grid
    for (const node of selectedNodes) {
        layoutGrid.appendChild(node);
    }
    // Set the background to not filled
    layoutGrid.backgrounds = [];
    // Set the final position of the layout grid to the initial position of the selected nodes
    layoutGrid.x = initialX;
    layoutGrid.y = initialY;
    // Select the layout grid
    figma.currentPage.selection = [layoutGrid];
}
// Function to convert a frame to a group
function convertFrameToGroup(frameNode) {
    // Check if the node is a frame
    if (frameNode.type === "FRAME") {
        // Create a new group
        const group = figma.group([frameNode], frameNode.parent);
        // Set the position and size of the group to match the original frame
        group.x = frameNode.x;
        group.y = frameNode.y;
        group.resize(frameNode.width, frameNode.height);
        // Remove the original frame
        frameNode.remove();
        // Return the new group
        return group;
    }
    else {
        // If the node is not a frame, show an error notification
        figma.notify("Selected node is not a frame. Please select a frame to convert to a group.");
        return null;
    }
}
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-rectangles') {
        const nodes = [];
        for (let i = 0; i < msg.count; i++) {
            const rect = figma.createRectangle();
            rect.x = i * 150;
            rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
            figma.currentPage.appendChild(rect);
            nodes.push(rect);
        }
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
    if (msg.type === 'shortcut-group') {
        GroupElements();
    }
    if (msg.type === 'shortcut-autolayout') {
        applyAutoLayout();
    }
    if (msg.type === 'shortcut-convert') {
        const selectedItems = figma.currentPage.selection;
        if (selectedItems.length > 0) {
            // Check if the first selected item is a group
            if (selectedItems[0].type === "GROUP") {
                // Selected item is a group, proceed to convert it into a frame with no fill properties
                convertToFrameWithNoFill();
            }
            else {
                // No group is selected, first group the elements and then convert the group into a frame with no fill properties
                GroupElements();
                convertToFrameWithNoFill();
            }
        }
    }
    if (msg.type === 'shortcut-ungroup') {
        ungroupElements();
    }
};
