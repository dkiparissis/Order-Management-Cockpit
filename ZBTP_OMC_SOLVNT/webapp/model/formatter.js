sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        UTCDate: function (dDate) {
            if (!dDate) {
                return null;
            }

            var userOffset = dDate.getTimezoneOffset() * 60000,
                dReturn = new Date(dDate.getTime() - userOffset);

            return dReturn;
        },

        deletionIndicatorFormatter: function (sInd, bEditable) {
            return ((!(sInd)) || sInd !== "D") && bEditable;
        },

        materialQtyStateFormatter: function (fQty, sUom, fQtyConv, fQtyComp, sUomComp) {
            var sReturn = "None";
            if (!(fQty)) {
                sReturn = "Error";
            } else {
                if (!!(sUom)) {
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

        materialQtyStateTextFormatter: function (fQty, sUom, fQtyConv, fQtyComp, sUomComp) {
            var sReturn = "",
                oI18n = this.getView().getModel("i18n")?.getResourceBundle();
            if (!(fQty)) {
                sReturn = (!!(oI18n)) ? oI18n.getText("fieldMandatory") : "";
            } else {
                if (!!(sUom)) {
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