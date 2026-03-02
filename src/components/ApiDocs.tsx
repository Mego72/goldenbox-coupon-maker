import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRANCHES } from "@/constants/branches";

const BASE_URL = `https://bqgmdbukvhumylptshis.supabase.co/functions/v1`;
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ21kYnVrdmh1bXlscHRzaGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODk2NzIsImV4cCI6MjA4NjY2NTY3Mn0.YZ6W2Ob8GNKwWv9bmxrOS0aSwly32Y5ZmQQ_qTQrA1U";

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-secondary rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground border border-border" dir="ltr">
    <code>{children}</code>
  </pre>
);

const ApiDocs = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Introduction */}
      <Card className="gold-glow">
        <CardHeader>
          <CardTitle className="gold-gradient-text text-xl">{t("apiDocsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground text-sm">
          <p>{t("apiDocsIntro")}</p>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("apiBaseUrl")}:</p>
            <CodeBlock>{BASE_URL}</CodeBlock>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("apiRequiredHeaders")}:</p>
            <CodeBlock>{`Content-Type: application/json
apikey: ${ANON_KEY}`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* Check Coupon API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="gold-gradient-bg text-primary-foreground">POST</Badge>
            <CardTitle className="text-lg font-mono">/check-coupon</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("checkCouponDesc")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestBody")}</h4>
            <CodeBlock>{JSON.stringify({ code: "GOLD-A1B2C3" }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestParams")}</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramName")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramType")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramRequired")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramDescription")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">code</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("checkCodeDesc")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("successResponse")} (200)</h4>
            <CodeBlock>{JSON.stringify({
              valid: true,
              coupon: {
                id: "uuid",
                code: "GOLD-A1B2C3",
                discount_type: "percentage",
                discount_value: 20,
                max_discount_value: 100,
                company_name: "شركة مثال",
                expiry_date: "2025-12-31",
                is_active: true,
                is_consumed: false,
                consumed_at: null,
                consumed_by_customer: null,
                consumed_by_mobile: null,
                branch_name: null,
                is_expired: false
              }
            }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("errorResponses")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">400</Badge>
                <span className="text-muted-foreground">{t("error400Check")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">404</Badge>
                <span className="text-muted-foreground">{t("error404")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">500</Badge>
                <span className="text-muted-foreground">{t("error500")}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("curlExample")}</h4>
            <CodeBlock>{`curl -X POST ${BASE_URL}/check-coupon \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${ANON_KEY}" \\
  -d '{"code": "GOLD-A1B2C3"}'`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* Consume Coupon API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="gold-gradient-bg text-primary-foreground">POST</Badge>
            <CardTitle className="text-lg font-mono">/consume-coupon</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("consumeCouponDesc")}</p>
          <p className="text-xs text-muted-foreground mt-1 italic">{t("unlimitedApiNote")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestBody")}</h4>
            <CodeBlock>{JSON.stringify({
              code: "GOLD-A1B2C3",
              customer_name: "أحمد محمد",
              mobile_number: "01012345678",
              branch_name: "مدينتي",
              credit_number: "CR-2025-001",
              company_due: 150.00
            }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestParams")}</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramName")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramType")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramRequired")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramDescription")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">code</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("consumeCodeDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">customer_name</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("customerNameDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">mobile_number</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("mobileNumberDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">branch_name</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {t("branchNameDesc")}: {BRANCHES.join(" | ")}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">credit_number</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">Optional</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("creditNumberDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">company_due</td>
                    <td className="px-4 py-2 text-muted-foreground">number</td>
                    <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">Optional</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("companyDueDesc")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("successResponse")} (200)</h4>
            <CodeBlock>{JSON.stringify({
              success: true,
              message: "Coupon consumed successfully"
            }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("errorResponses")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">400</Badge>
                <span className="text-muted-foreground">{t("error400Consume")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">404</Badge>
                <span className="text-muted-foreground">{t("error404")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">409</Badge>
                <span className="text-muted-foreground">{t("error409")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">500</Badge>
                <span className="text-muted-foreground">{t("error500")}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("curlExample")}</h4>
            <CodeBlock>{`curl -X POST ${BASE_URL}/consume-coupon \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${ANON_KEY}" \\
  -d '{
    "code": "GOLD-A1B2C3",
    "customer_name": "أحمد محمد",
    "mobile_number": "01012345678",
    "branch_name": "مدينتي",
    "credit_number": "CR-2025-001",
    "company_due": 150.00
  }'`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* Update Coupon Payment API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="gold-gradient-bg text-primary-foreground">POST</Badge>
            <CardTitle className="text-lg font-mono">/update-coupon-payment</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("updateCouponPaymentDesc")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestBody")}</h4>
            <CodeBlock>{JSON.stringify({
              code: "GOLD-A1B2C3",
              credit_number: "CR-2025-001",
              company_due: 150.00
            }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("requestParams")}</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramName")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramType")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramRequired")}</th>
                    <th className="px-4 py-2 text-start text-foreground">{t("paramDescription")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">code</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="destructive" className="text-xs">{t("required")}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("consumeCodeDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">credit_number</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">Optional*</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("creditNumberDesc")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-primary">company_due</td>
                    <td className="px-4 py-2 text-muted-foreground">number</td>
                    <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">Optional*</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t("companyDueDesc")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">* {lang === "ar" ? "يجب إرسال واحد على الأقل من credit_number أو company_due" : "At least one of credit_number or company_due is required"}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("successResponse")} (200)</h4>
            <CodeBlock>{JSON.stringify({
              success: true,
              message: "Coupon updated successfully"
            }, null, 2)}</CodeBlock>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("errorResponses")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">400</Badge>
                <span className="text-muted-foreground">{t("error400UpdatePayment")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">404</Badge>
                <span className="text-muted-foreground">{t("error404")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">500</Badge>
                <span className="text-muted-foreground">{t("error500")}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t("curlExample")}</h4>
            <CodeBlock>{`curl -X POST ${BASE_URL}/update-coupon-payment \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${ANON_KEY}" \\
  -d '{
    "code": "GOLD-A1B2C3",
    "credit_number": "CR-2025-001",
    "company_due": 150.00
  }'`}</CodeBlock>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocs;
