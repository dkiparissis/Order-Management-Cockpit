sap.ui.define([], function () { 
    "use strict"; 
    return { 
        numberUnit: function (n) { 
            if (!n) { 
                return "" 
            } 
            return parseFloat(n).toFixed(2) 
        },

        // + evkontos 24.4.2024
        UTCDate: function (dDate) {
            if (!dDate) {
                return null;
            }

            var userOffset = dDate.getTimezoneOffset() * 60000,
                dReturn = new Date(dDate.getTime() - userOffset);

            return dReturn;
        },

        deliveryDateFormatter: function (dDate) {
            if (!dDate) {
                return null;
            }
            return dDate.toLocaleDateString("en-GB").replaceAll("/",".");
        },

        deletionIndicatorFormatter: function (sInd, sMode) {
            return ((!(sInd)) || sInd !== "D") && (sMode !== "display");
        },

        // + evkontos 24.4.2024
        materialQtyStateFormatter: function (fQty, sUom, fQtyConv, fQtyComp, sUomComp) {
            var sReturn = "None";
            if (!(fQty)) {
                sReturn = "Error";
            } else {
                if (!!(sUom)){
                    // if statement kept for consistency with following Text formatter
                    if (sUom === sUomComp) {
                        if ((!!(fQty)) && (!!(fQtyComp)) && (fQty > fQtyComp)) {
                            sReturn = "Warning";
                        }
                    } else {
                        if ((!!(fQtyConv)) && (!!(fQtyComp)) && (fQtyConv > fQtyComp)) {
                            sReturn = "Warning";
                        }
                    }
                }
            }
            return sReturn;
        },

        // + evkontos 24.4.2024
        materialQtyStateTextFormatter: function (fQty, sUom, fQtyConv, fQtyComp, sUomComp) {
            var sReturn = "",
                oI18n = this.getView().getModel("i18n")?.getResourceBundle();
            if (!(fQty)) {
                sReturn = (!!(oI18n)) ? oI18n.getText("fieldMandatory") : "";
            } else {
                if (!!(sUom)){
                    if (sUom === sUomComp) {
                        if ((!!(fQty)) && (!!(fQtyComp)) && (fQty > fQtyComp)) {
                            sReturn = (!!(oI18n)) ? oI18n.getText("qtyError", [fQty, sUom, fQtyComp, sUomComp]) : "";
                        }
                    } else {
                        if ((!!(fQtyConv)) && (!!(fQtyComp)) && (fQtyConv > fQtyComp)) {
                            sReturn = (!!(oI18n)) ? oI18n.getText("convertedQtyError", [fQtyConv, sUomComp, fQtyComp, sUomComp]) : "";
                        }
                    }
                }
            }
            return sReturn;
        },

        // + evkontos 26.4.2024
        getTotalCompartmentCapacity: function (aCompartments) {
            if (aCompartments.length > 0) {
                return aCompartments.reduce(function(fSum, oCompartment){
                    return fSum + (+oCompartment.Volume);
                    }, 0).toLocaleString() + " " + aCompartments[0]?.Uom;
            } else {
                return "0.00 L";
            }
        }
    };
});