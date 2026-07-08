import { Body, Controller, Inject, Post } from "@nestjs/common";
import type {
  CreateCompanyRequest,
  CreateCompanyResponse,
} from "@oc01/contracts";
import { CompaniesService } from "./companies.service.js";

@Controller("/api/admin/companies")
export class CompaniesController {
  constructor(
    @Inject(CompaniesService) private readonly companies: CompaniesService,
  ) {}

  @Post()
  create(
    @Body() request: CreateCompanyRequest,
  ): Promise<CreateCompanyResponse> {
    return this.companies.createCompany(request);
  }
}
