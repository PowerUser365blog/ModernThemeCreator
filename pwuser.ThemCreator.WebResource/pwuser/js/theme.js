function blockName(executionContext) {
    var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    if (formContext.ui.getFormType() !== 1) {
        var themeNameControl = formContext.getControl("pwuser_name");
        themeNameControl.setDisabled(true);
    }
};

function setValues(executionContext,colorRef,fieldName) {
    var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    var colorValue = formContext.getAttribute(colorRef).getValue();
if (colorValue != null) {
    var contrastColor = getContrastColor(colorValue);
    formContext.getAttribute(fieldName).setValue(contrastColor);

    }
    if (fieldName == "pwuser_backgroundhover") {
        var foregroundhover = getContrastColor(contrastColor);
        formContext.getAttribute("pwuser_foregroundhover").setValue(foregroundhover);
        formContext.getAttribute("pwuser_backgroundpressed").setValue(contrastColor);
        formContext.getAttribute("pwuser_backgroundselected").setValue(contrastColor);
        formContext.getAttribute("pwuser_foregroundselected").setValue(contrastColor);
        formContext.getAttribute("pwuser_foregroundpressed").setValue(foregroundhover);

    }
};
function setFixedValues(executionContext, colorRef, fieldName) {
var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    var colorValue = formContext.getAttribute(colorRef).getValue();
    if (colorValue != null) {
        formContext.getAttribute(fieldName).setValue(colorRef);
    }
}

function calculateContrast(color) {
    function getLuminance(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const luminance = getLuminance(color);

    const contrastWithWhite = (luminance + 0.05) / (1.05);
    const contrastWithBlack = (luminance + 0.05) / (0.05);

    return Math.max(contrastWithWhite, contrastWithBlack);
}

function getContrastColor(hexColor) {
    const contrastWithWhite = calculateContrast(hexColor);
    const contrastWithBlack = calculateContrast('#000000');

    return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000';
}