sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("sto.controller.App", {

        onInit : function () {
            // apply content density mode to root view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this._decideLogo();
        },

        // + evkontos 15.4.204
        _decideLogo: function() {
            var oUser = sap.ushell.Container.getService("UserInfo").getUser(),
                sTheme = oUser.getTheme(),
                aDarkThemes = [
                // "sap_horizon",			// Morning Horizon
                    "sap_horizon_dark",		// Evening Horizon
                    "sap_horizon_hcb",		// High Contrast Black
                // "sap_horizon_hcw"		// High Contrast White
                // "sap_fiori_3",			// Quartz Light
                    "sap_fiori_3_dark",		// Quartz Dark
                    "sap_fiori_3_hcb",		// High Contrast Black
                // "sap_fiori_3_hcw",		// High Contrast White
                // "sap_belize",			// Belize
                    "sap_belize_plus",		// Belize Deep
                    "sap_belize_hcb",		// High Contrast Black
                // "sap_belize_hcw",		// High Contrast White
                // "sap_bluecrystal"		// Blue Crystal
                    "sap_hcb"				// High Contrast Black
                ],
                bThemeIsDark = aDarkThemes.includes(sTheme),
                sVariable = "--custom-logo",
                sDarkness = (bThemeIsDark) ? "white" : "Standard",
                sFilename = "https://www.helleniqenergy.gr/themes/custom/helpe_theme/images/HELLENiQ_Logo_" + sDarkness + ".svg",
                oRoot = document.querySelector(":root");
            
            oRoot.style.setProperty(sVariable, "url('" + sFilename + "')");
        }
    });

});