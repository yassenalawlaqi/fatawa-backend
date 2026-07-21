"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FatawaModule = void 0;
const common_1 = require("@nestjs/common");
const fatawa_controller_1 = require("./fatawa.controller");
const scholars_controller_1 = require("./scholars.controller");
const categories_controller_1 = require("./categories.controller");
const fatawa_service_1 = require("./fatawa.service");
const fatawa_repository_1 = require("./fatawa.repository");
let FatawaModule = class FatawaModule {
};
exports.FatawaModule = FatawaModule;
exports.FatawaModule = FatawaModule = __decorate([
    (0, common_1.Module)({
        controllers: [fatawa_controller_1.FatawaController, scholars_controller_1.ScholarsController, categories_controller_1.CategoriesController],
        providers: [fatawa_service_1.FatawaService, fatawa_repository_1.FatawaRepository],
    })
], FatawaModule);
//# sourceMappingURL=fatawa.module.js.map