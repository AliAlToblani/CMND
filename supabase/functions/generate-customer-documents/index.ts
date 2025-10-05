import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DOO brand colors - smooth gradient from purple to white
const DOO_PURPLE = [138, 43, 226]; // #8A2BE2
const DOO_WHITE = [255, 255, 255]; // #FFFFFF

// Professional header with smooth gradient
async function drawProfessionalHeader(
  page: any,
  boldFont: any,
  regularFont: any,
  dooLogoBytes: Uint8Array | null,
  customerLogoBytes: Uint8Array | null,
  pdfDoc: any
) {
  const { width, height } = page.getSize();
  const headerHeight = 70;

  // Draw ultra-smooth gradient (purple to white, 50 steps)
  const gradientSteps = 50;
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = DOO_PURPLE[0] + (DOO_WHITE[0] - DOO_PURPLE[0]) * ratio;
    const g = DOO_PURPLE[1] + (DOO_WHITE[1] - DOO_PURPLE[1]) * ratio;
    const b = DOO_PURPLE[2] + (DOO_WHITE[2] - DOO_PURPLE[2]) * ratio;

    page.drawRectangle({
      x: (width / gradientSteps) * i,
      y: height - headerHeight,
      width: width / gradientSteps + 1,
      height: headerHeight,
      color: rgb(r / 255, g / 255, b / 255),
    });
  }

  // Embed BIGGER DOO logo
  if (dooLogoBytes) {
    try {
      const dooLogo = await pdfDoc.embedPng(dooLogoBytes);
      const logoWidth = 150; // BIGGER
      const logoHeight = 55;  // BIGGER
      page.drawImage(dooLogo, {
        x: 50,
        y: height - headerHeight + 8,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      console.error('[EDGE-FUNCTION] Error embedding DOO logo:', error);
    }
  }

  // Embed customer logo on the right
  if (customerLogoBytes) {
    try {
      const customerLogo = await pdfDoc.embedPng(customerLogoBytes);
      const custLogoWidth = 60;
      const custLogoHeight = 40;
      page.drawImage(customerLogo, {
        x: width - 110,
        y: height - headerHeight + 15,
        width: custLogoWidth,
        height: custLogoHeight,
      });
    } catch (error) {
      console.error('[EDGE-FUNCTION] Error embedding customer logo:', error);
    }
  }
}

// Footer with page number
function drawFooter(page: any, text: string, font: any, pageNum: number) {
  const { width } = page.getSize();

  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText(text, {
    x: 50,
    y: 35,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Page ${pageNum}`, {
    x: width - 100,
    y: 35,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
}

// Helper: Get voice tier details
function getVoiceTierDetails(tier: string) {
  const tiers: Record<string, { range: string; minimum: number }> = {
    tier_1: { range: '100–399 hours', minimum: 150 },
    tier_2: { range: '400–999 hours', minimum: 400 },
    tier_3: { range: '1,000–2,999 hours', minimum: 1000 },
    tier_4: { range: '3,000+ hours', minimum: 3000 },
  };
  return tiers[tier] || { range: 'N/A', minimum: 0 };
}

// PROPOSAL - Complete template match
async function generateProposal(
  customer: any,
  dooLogoBytes: Uint8Array | null,
  customerLogoBytes: Uint8Array | null
) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ===== PAGE 1: COVER =====
  const coverPage = pdfDoc.addPage([595, 842]);
  const { width: w1, height: h1 } = coverPage.getSize();

  coverPage.drawText('AI CX PROPOSAL', {
    x: w1 / 2 - 120,
    y: h1 / 2,
    size: 36,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });

  // ===== PAGE 2: DOO OVERVIEW =====
  const page1 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page1, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  let yPos = h1 - 140;

  page1.drawText('DOO: Innovative AI Solutions for Customer Service and Marketing', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 30;

  const overview = [
    'DOO is an innovative platform that leverages the power of AI to enhance customer',
    'service and marketing for businesses. Our goal is to help companies streamline their',
    'customer interactions, boost engagement, and improve sales processes using advanced',
    'AI technology.',
    '',
    'We believe in providing ongoing, personalized support that helps businesses operate',
    'more efficiently and connect with their customers whenever and wherever they need.',
  ];

  overview.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 11, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  yPos -= 20;
  page1.drawText("Here's what we offer:", {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const offerings = [
    '• AI-Powered Customer Service: Automate responses on popular messaging',
    '  platforms like WhatsApp and Instagram, so you can respond to your customers',
    '  quickly and effectively.',
    '',
    '• Custom AI Agents: We create personalized AI agents that fit the unique needs',
    '  and voice of your business.',
    '',
    'At DOO, we ensure that customer interactions are instant and personalized, with',
    'support for multiple languages, creating a smooth experience for everyone. Our',
    'solutions not only enhance service quality but also help reduce operational costs.',
    '',
    'We primarily serve businesses that want to elevate their customer experience',
    'through automation, making it easier to meet the needs of their clients.',
  ];

  offerings.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 11, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  drawFooter(page1, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 1);

  // ===== PAGE 3: PROBLEMS & ADVANTAGES =====
  const page2 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page2, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = h1 - 140;

  page2.drawText('PROBLEMS WE SOLVE', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 35;

  const problems = [
    '1. Overwhelmed Teams',
    '   Customer service teams struggle to keep up with high volumes of inquiries,',
    '   leading to delayed responses and frustrated customers.',
    '',
    '2. Missed Opportunities',
    '   Without 24/7 availability, businesses miss out on potential sales and customer',
    '   engagement during off-hours.',
    '',
    '3. Lack of Insights',
    '   Traditional customer service doesn\'t capture valuable data that could drive',
    '   business improvements.',
  ];

  problems.forEach((line) => {
    const font = line.match(/^\d\./) ? boldFont : regularFont;
    page2.drawText(line, { x: 50, y: yPos, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 25;
  page2.drawText('OUR ADVANTAGES', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 35;

  const advantages = [
    'Streamlined Operations',
    'Reduces response times and operational costs, optimizing service delivery.',
    '',
    'Aligned Values',
    'Mirrors your brand personality in every interaction.',
    '',
    'Continuous Improvement',
    'Utilizes DOO\'s AI-driven insights to continually enhance service offerings.',
  ];

  advantages.forEach((line) => {
    const font = line.length < 30 ? boldFont : regularFont;
    page2.drawText(line, { x: 50, y: yPos, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
    yPos -= line.length < 30 ? 22 : 16;
  });

  drawFooter(page2, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 2);

  // ===== PAGE 4: PRICING & CUSTOMER DETAILS =====
  const page3 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page3, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = h1 - 140;

  page3.drawText(`PROPOSAL FOR ${customer.name.toUpperCase()}`, {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 35;

  // Client Info
  const clientInfo = [
    `Company: ${customer.name}`,
    `CR Number: ${customer.company_registration_number || 'N/A'}`,
    `Country: ${customer.country || 'N/A'}`,
    `Industry: ${customer.industry || 'N/A'}`,
    `Contact: ${customer.contact_name || 'N/A'}`,
  ];

  clientInfo.forEach((line) => {
    page3.drawText(line, { x: 50, y: yPos, size: 11, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    yPos -= 18;
  });

  yPos -= 25;

  const currency = customer.currency || 'BD';
  const setupFee = customer.setup_fee || 0;
  const annualRate = customer.annual_rate || 0;

  page3.drawText('INVESTMENT SUMMARY', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 30;

  // Service Type & Plan Details
  if (customer.service_type) {
    const serviceLabels = {
      text: 'Text AI Service',
      voice: 'Voice AI Service',
      both: 'Text & Voice AI Service',
    };
    page3.drawText(`Service Type: ${serviceLabels[customer.service_type as keyof typeof serviceLabels]}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 25;

    // Text Plan
    if (customer.text_plan && (customer.service_type === 'text' || customer.service_type === 'both')) {
      const planName = customer.text_plan === 'basic' ? 'Basic Plan' : 'Growth Plan';
      page3.drawText(`Text Plan: ${planName}`, {
        x: 60,
        y: yPos,
        size: 11,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 20;

      if (customer.text_ai_responses) {
        page3.drawText(`• ${customer.text_ai_responses.toLocaleString()} AI responses per month`, {
          x: 70,
          y: yPos,
          size: 10,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      }
      yPos -= 10;
    }

    // Voice Plan
    if (customer.voice_tier && (customer.service_type === 'voice' || customer.service_type === 'both')) {
      const tierDetails = getVoiceTierDetails(customer.voice_tier);
      page3.drawText(`Voice Plan: Tier ${customer.voice_tier.replace('tier_', '')}`, {
        x: 60,
        y: yPos,
        size: 11,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 20;

      page3.drawText(`• Usage Range: ${tierDetails.range}`, {
        x: 70,
        y: yPos,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 18;

      if (customer.voice_hours) {
        page3.drawText(`• Monthly Commitment: ${customer.voice_hours} hours`, {
          x: 70,
          y: yPos,
          size: 10,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      }

      if (customer.voice_price_per_hour) {
        page3.drawText(`• Price: ${customer.voice_price_per_hour} ${currency} per hour`, {
          x: 70,
          y: yPos,
          size: 10,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;

        if (customer.voice_hours) {
          const annualCost = customer.voice_price_per_hour * customer.voice_hours * 12;
          page3.drawText(`• Estimated Annual Cost: ${annualCost.toLocaleString()} ${currency}`, {
            x: 70,
            y: yPos,
            size: 10,
            font: boldFont,
            color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
          });
          yPos -= 18;
        }
      }
      yPos -= 10;
    }
  }

  yPos -= 15;

  // Pricing Breakdown
  page3.drawText('PRICING BREAKDOWN', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 30;

  page3.drawText(`Setup Fee (One-time): ${setupFee.toLocaleString()} ${currency}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 20;

  page3.drawText(`Annual Subscription: ${annualRate.toLocaleString()} ${currency}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 25;

  const total = setupFee + annualRate;
  page3.drawText(`Total First Year: ${total.toLocaleString()} ${currency}`, {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });

  drawFooter(page3, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 3);

  return await pdfDoc.save();
}

// SERVICE AGREEMENT - Complete template match
async function generateServiceAgreement(
  customer: any,
  dooLogoBytes: Uint8Array | null,
  customerLogoBytes: Uint8Array | null
) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // PAGE 1
  const page1 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page1, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  let yPos = 842 - 140;

  page1.drawText('SERVICE AGREEMENT', {
    x: 50,
    y: yPos,
    size: 20,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 40;

  const intro = [
    `This Service Agreement ("Agreement") is entered into on [Date] by and between:`,
    '',
    `Party A: DOO Technology Solutions, a company incorporated under the laws of the`,
    `Kingdom of Bahrain, with commercial registration number 173610-1 having its principal`,
    `place of business at Office 39, Building 111, Road 385, Block 304, Manama Center,`,
    `Kingdom of Bahrain ("Service Provider"); and`,
    '',
    `Party B: ${customer.name}, ${customer.country || 'N/A'} (Company Registration No.:`,
    `${customer.company_registration_number || 'N/A'}), organized and existing under the laws of`,
    `${customer.country || 'N/A'}. Located at: ${customer.legal_address || 'N/A'}.`,
    `Represented herein by: ${customer.representative_name || 'N/A'} ("Client").`,
    '',
    `Collectively referred to as the "Parties" and individually as a "Party."`,
  ];

  intro.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 20;
  page1.drawText('1. Scope of Services', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 22;

  const scope = [
    'The Service Provider shall deliver artificial intelligence (AI) solutions, systems, and',
    'related services as described in Schedule A (Services Description).',
    '',
    'Any additional services outside the agreed scope shall be subject to a separate written',
    'agreement or addendum.',
  ];

  scope.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 20;
  page1.drawText('2. Term & Duration', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 22;

  const term = [
    'This Agreement shall commence on the Effective Date and shall remain in force for',
    '12 months unless earlier terminated in accordance with this Agreement.',
    '',
    'The Agreement may be renewed upon mutual written agreement of the Parties.',
  ];

  term.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 20;
  page1.drawText('3. Fees & Payment', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 22;

  const currency = customer.currency || 'BD';
  const paymentTerms = customer.payment_terms_days || 14;

  const fees = [
    'The Client shall pay the Service Provider the fees specified in Schedule B (Fees &',
    'Payment Terms).',
    '',
    `Payment shall be made within ${paymentTerms} days of receipt of a valid invoice.`,
    '',
    'Each Party shall bear its own costs not expressly covered under this Agreement.',
  ];

  fees.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  drawFooter(page1, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 1);

  // PAGE 2
  const page2 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page2, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = 842 - 140;

  const sections = [
    {
      title: '4. Intellectual Property',
      content: [
        'All pre-existing intellectual property of each Party shall remain their respective',
        'property. Unless otherwise agreed, any AI systems, models, or software developed by',
        'the Service Provider under this Agreement shall remain the intellectual property of the',
        'Service Provider. The Client shall receive a non-exclusive, non-transferable license to',
        'use the deliverables solely for internal business purposes.',
      ],
    },
    {
      title: '5. Confidentiality',
      content: [
        'Each Party agrees to keep confidential all proprietary or sensitive information received',
        'during the course of this Agreement. Confidentiality obligations shall survive',
        'termination of this Agreement for a period of 2 years.',
      ],
    },
    {
      title: '6. Warranties & Disclaimers',
      content: [
        'The Service Provider warrants that it will perform the Services with reasonable skill',
        'and care. The Service Provider does not warrant that AI systems will be error-free or',
        'guarantee specific outcomes. However, such expected outcomes are mentioned in',
        'Schedule C (Expected Outcomes).',
      ],
    },
    {
      title: '7. Limitation of Liability',
      content: [
        'Neither Party shall be liable for indirect, incidental, or consequential damages. The',
        'Service Provider\'s total liability under this Agreement shall not exceed the total fees',
        'paid by the Client in the duration of the agreement preceding the claim.',
      ],
    },
    {
      title: '8. Termination',
      content: [
        'Either Party may terminate this Agreement by giving 30 days\' written notice. Either',
        'Party may terminate this Agreement immediately by written notice if the other Party',
        'commits a material breach, becomes insolvent, or engages in fraud, gross negligence,',
        'willful misconduct, or unlawful conduct.',
      ],
    },
  ];

  sections.forEach((section) => {
    page2.drawText(section.title, {
      x: 50,
      y: yPos,
      size: 13,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 22;

    section.content.forEach((line) => {
      page2.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
      yPos -= 16;
    });
    yPos -= 18;
  });

  drawFooter(page2, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 2);

  // PAGE 3
  const page3 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page3, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = 842 - 140;

  const finalSections = [
    {
      title: '9. Governing Law & Dispute Resolution',
      content: [
        'This Agreement shall be governed by the laws of the Kingdom of Bahrain. Any disputes',
        'shall be resolved amicably between the Parties, failing which they shall be submitted',
        'to the exclusive jurisdiction of the courts of the Kingdom of Bahrain.',
      ],
    },
    {
      title: '10. Miscellaneous',
      content: [
        'This Agreement constitutes the entire agreement between the Parties and supersedes',
        'all prior understandings. Amendments must be in writing and signed by both Parties.',
        'Neither Party may assign its rights or obligations without prior written consent of the',
        'other Party.',
      ],
    },
  ];

  finalSections.forEach((section) => {
    page3.drawText(section.title, {
      x: 50,
      y: yPos,
      size: 13,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 22;

    section.content.forEach((line) => {
      page3.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
      yPos -= 16;
    });
    yPos -= 25;
  });

  // SCHEDULES
  page3.drawText('SCHEDULE A: SERVICES DESCRIPTION', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 22;

  if (customer.service_type) {
    const serviceLabels = {
      text: 'Text AI Service',
      voice: 'Voice AI Service',
      both: 'Text & Voice AI Service',
    };
    page3.drawText(`Service Type: ${serviceLabels[customer.service_type as keyof typeof serviceLabels]}`, {
      x: 50,
      y: yPos,
      size: 10,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 20;

    if (customer.text_plan) {
      const planName = customer.text_plan === 'basic' ? 'Basic Plan' : 'Growth Plan';
      page3.drawText(`Text Plan: ${planName} (${customer.text_ai_responses?.toLocaleString() || 0} AI responses/month)`, {
        x: 50,
        y: yPos,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 18;
    }

    if (customer.voice_tier) {
      const tierDetails = getVoiceTierDetails(customer.voice_tier);
      page3.drawText(`Voice Plan: Tier ${customer.voice_tier.replace('tier_', '')} (${tierDetails.range}, ${customer.voice_hours || 0} hours/month)`, {
        x: 50,
        y: yPos,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 18;
    }
  }

  yPos -= 25;
  page3.drawText('SCHEDULE B: FEES & PAYMENT TERMS', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 22;

  const setupFee = customer.setup_fee || 0;
  const annualRate = customer.annual_rate || 0;

  page3.drawText(`Setup Fee: ${setupFee.toLocaleString()} ${currency}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 18;

  page3.drawText(`Annual Subscription: ${annualRate.toLocaleString()} ${currency}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 18;

  page3.drawText(`Payment Terms: ${paymentTerms} days`, {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  drawFooter(page3, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 3);

  return await pdfDoc.save();
}

// SLA - Complete template match
async function generateSLA(
  customer: any,
  dooLogoBytes: Uint8Array | null,
  customerLogoBytes: Uint8Array | null
) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // PAGE 1
  const page1 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page1, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  let yPos = 842 - 140;

  page1.drawText('DOO ENTERPRISE SERVICE LEVEL AGREEMENT (SLA)', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 40;

  page1.drawText('1. Overview', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const overview = [
    'This Service Level Agreement ("SLA") defines the standards of service and support',
    'provided by DOO Technology Solutions ("DOO") to its enterprise clients. It ensures',
    'maximum platform availability, rapid issue response, and a consistently high-quality',
    'customer experience.',
  ];

  overview.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 25;
  page1.drawText('2. Service Commitment', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  // Table headers
  page1.drawRectangle({ x: 50, y: yPos - 15, width: 200, height: 20, color: rgb(0.9, 0.9, 0.9) });
  page1.drawRectangle({ x: 250, y: yPos - 15, width: 295, height: 20, color: rgb(0.9, 0.9, 0.9) });

  page1.drawText('Metric', { x: 55, y: yPos - 10, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Commitment', { x: 255, y: yPos - 10, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  yPos -= 35;

  // Table rows
  const commitments = [
    ['Service Uptime', '99.999% Monthly Uptime Guarantee'],
    ['Initial Response Time', 'Within 1 hour for all support tickets'],
    ['Support Availability', '24 hours a day, 7 days a week, 365 days a year'],
  ];

  commitments.forEach(([metric, commitment]) => {
    page1.drawText(metric, { x: 55, y: yPos, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page1.drawText(commitment, { x: 255, y: yPos, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  yPos -= 15;
  const note = [
    'Service uptime is measured across DOO-managed services and channels, excluding',
    'scheduled maintenance windows or client-side infrastructure issues.',
  ];

  note.forEach((line) => {
    page1.drawText(line, { x: 50, y: yPos, size: 9, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    yPos -= 14;
  });

  drawFooter(page1, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 1);

  // PAGE 2
  const page2 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page2, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = 842 - 140;

  page2.drawText('3. Support and Severity Levels', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 30;

  // Severity table
  const severityData = [
    ['Critical (Severity 1)', 'Platform down, major disruption', 'Within 1 hour', '4 hours or less'],
    ['High (Severity 2)', 'Major functionality impaired', 'Within 1 hour', '8 hours or less'],
    ['Medium (Severity 3)', 'Partial loss of functionality', 'Within 1 hour', '24 hours'],
    ['Low (Severity 4)', 'Minor issues, feature requests', 'Within 1 hour', '3 business days'],
  ];

  yPos -= 5;
  page2.drawText('Severity', { x: 52, y: yPos, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Description', { x: 135, y: yPos, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Response', { x: 280, y: yPos, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Resolution', { x: 380, y: yPos, size: 8, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  yPos -= 20;

  severityData.forEach(([severity, desc, response, resolution]) => {
    page2.drawText(severity, { x: 52, y: yPos, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page2.drawText(desc, { x: 135, y: yPos, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page2.drawText(response, { x: 280, y: yPos, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page2.drawText(resolution, { x: 380, y: yPos, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 25;
  page2.drawText('4. Support Channels', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const channels = [
    '• Email Support: Dedicated enterprise email (provided during onboarding)',
    '• Phone Support: Dedicated enterprise hotline (provided during onboarding)',
    '• DOO Support Portal: Access to ticketing, status updates, and knowledge base',
    '• Priority Escalation: Dedicated account manager for urgent issues',
  ];

  channels.forEach((line) => {
    page2.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  drawFooter(page2, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 2);

  // PAGE 3
  const page3 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page3, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = 842 - 140;

  page3.drawText('5. Scheduled Maintenance', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const maintenance = [
    '• Clients will be notified at least 72 hours in advance for scheduled maintenance.',
    '• Maintenance will be scheduled during low-traffic periods when possible.',
    '• Scheduled maintenance will not be counted against the uptime commitment.',
  ];

  maintenance.forEach((line) => {
    page3.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  yPos -= 25;
  page3.drawText('6. Remedies', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  page3.drawText('If DOO fails to meet the monthly uptime commitment, clients are eligible to receive', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 16;
  page3.drawText('service credits as follows:', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 30;

  const remedies = [
    ['99.9% - 99.999%', '5% of monthly fee'],
    ['99% - 99.89%', '10% of monthly fee'],
    ['Below 99%', '20% of monthly fee'],
  ];

  page3.drawText('Uptime Achieved', { x: 55, y: yPos, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page3.drawText('Service Credit', { x: 250, y: yPos, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  yPos -= 20;

  remedies.forEach(([uptime, credit]) => {
    page3.drawText(uptime, { x: 55, y: yPos, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page3.drawText(credit, { x: 250, y: yPos, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 16;
  });

  yPos -= 20;
  page3.drawText('Service credits must be requested within 30 days of the end of the impacted month.', {
    x: 50,
    y: yPos,
    size: 9,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPos -= 30;
  page3.drawText('7. Exclusions', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  page3.drawText('This SLA does not cover:', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 20;

  const exclusions = [
    '• Client-side network issues or third-party service failures.',
    '• Downtime due to force majeure events.',
    '• Service interruptions caused by client modifications without prior DOO approval.',
  ];

  exclusions.forEach((line) => {
    page3.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  drawFooter(page3, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 3);

  // PAGE 4
  const page4 = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page4, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  yPos = 842 - 140;

  page4.drawText('8. Continuous Improvement', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const improvement = [
    'DOO follows a continuous improvement model, integrating:',
    '',
    '• Regular system upgrades',
    '• Security enhancements',
    '• Performance optimizations',
    '• Feature releases based on client feedback',
  ];

  improvement.forEach((line) => {
    page4.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  yPos -= 25;
  page4.drawText('9. Contact Information', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const contact = [
    'For support or inquiries regarding this SLA, please contact:',
    '',
    'Email: hello@doo.ooo',
    'Website: www.doo.ooo',
    '',
    `Client Name: ${customer.name}`,
    `CR Number: ${customer.company_registration_number || 'N/A'}`,
  ];

  contact.forEach((line) => {
    page4.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 18;
  });

  drawFooter(page4, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 4);

  return await pdfDoc.save();
}

// QUOTATION - Complete template match
async function generateInvoice(
  customer: any,
  dooLogoBytes: Uint8Array | null,
  customerLogoBytes: Uint8Array | null
) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  await drawProfessionalHeader(page, boldFont, regularFont, dooLogoBytes, customerLogoBytes, pdfDoc);
  let yPos = 842 - 140;

  // QUOTATION Title
  page.drawText('QUOTATION', {
    x: 50,
    y: yPos,
    size: 24,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 50;

  // Client details
  page.drawText(`ADDRESSED TO: ${customer.contact_name || customer.name}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const today = new Date().toLocaleDateString('en-GB');
  page.drawText(`Date: ${today}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 18;

  page.drawText('Issued by: DOO Technology Solutions', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 18;

  page.drawText('CR: 173610-1', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 40;

  // Line items table
  const currency = customer.currency || 'BD';
  const setupFee = customer.setup_fee || 0;
  const annualRate = customer.annual_rate || 0;

  // Table header
  page.drawRectangle({ x: 50, y: yPos - 15, width: 495, height: 25, color: rgb(0.95, 0.95, 0.95) });
  page.drawText('Description', { x: 55, y: yPos - 8, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Qty', { x: 320, y: yPos - 8, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Price', { x: 390, y: yPos - 8, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Total', { x: 470, y: yPos - 8, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  yPos -= 40;

  // Line items
  const items = [];

  if (customer.service_type && customer.text_plan) {
    const planName = customer.text_plan === 'basic' ? 'Basic Plan' : 'Growth Plan';
    items.push([`${planName} x 12 Months`, '1', annualRate.toString(), annualRate.toString()]);
  } else if (customer.service_type && customer.voice_tier) {
    const tierName = `Tier ${customer.voice_tier.replace('tier_', '')}`;
    items.push([`${tierName} Voice Plan x 12 Months`, '1', annualRate.toString(), annualRate.toString()]);
  } else {
    items.push(['Annual Subscription', '1', annualRate.toString(), annualRate.toString()]);
  }

  if (setupFee > 0) {
    items.push(['Setup Fee', '1', setupFee.toString(), setupFee.toString()]);
  }

  items.forEach(([desc, qty, price, total]) => {
    page.drawText(desc, { x: 55, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(qty, { x: 320, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`${currency} ${price}`, { x: 390, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`${currency} ${total}`, { x: 470, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    yPos -= 22;
  });

  // Subtotal
  yPos -= 10;
  const totalAmount = setupFee + annualRate;
  page.drawText('Sub-total:', { x: 390, y: yPos, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`${currency} ${totalAmount.toLocaleString()}`, {
    x: 470,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 30;

  // TOTAL
  page.drawRectangle({ x: 380, y: yPos - 5, width: 165, height: 25, color: rgb(0.95, 0.95, 0.95) });
  page.drawText('TOTAL', { x: 390, y: yPos, size: 12, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`${currency} ${totalAmount.toLocaleString()}`, {
    x: 470,
    y: yPos,
    size: 12,
    font: boldFont,
    color: rgb(DOO_PURPLE[0] / 255, DOO_PURPLE[1] / 255, DOO_PURPLE[2] / 255),
  });
  yPos -= 50;

  // Payment Method
  page.drawText('Payment Method', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 25;

  const paymentDetails = [
    'Bank Name: Bahrain Islamic Bank',
    'Account Name: DOO Technology Solutions',
    'IBAN: BH97BIBB00100002211548',
    'SWIFT: BIBBBHBMXXX',
  ];

  paymentDetails.forEach((line) => {
    page.drawText(line, { x: 50, y: yPos, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    yPos -= 18;
  });

  yPos -= 25;

  // Terms and Conditions
  page.drawText('Terms and Conditions', {
    x: 50,
    y: yPos,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 22;

  const paymentTerms = customer.payment_terms_days || 14;
  page.drawText(`Please send payment within ${paymentTerms} days of receiving this invoice.`, {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 40;

  // Signature
  page.drawText('Ali Mohsen', {
    x: 50,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 18;

  page.drawText('CEO', {
    x: 50,
    y: yPos,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  drawFooter(page, 'DOO • hello@doo.ooo • www.doo.ooo', regularFont, 1);

  return await pdfDoc.save();
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_id, document_types, format = 'pdf', options = {} } = await req.json();

    console.log('[EDGE-FUNCTION] Generating documents:', {
      customer_id,
      document_types,
      format,
      options,
    });

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    // Fetch DOO logo from CDN
    let dooLogoBytes: Uint8Array | null = null;
    try {
      const logoUrl = 'https://cdn.prod.website-files.com/68ac62e7fc79b26131535066/68ad505697774505c5b64767_doo-logo.png';
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        dooLogoBytes = new Uint8Array(logoArrayBuffer);
        console.log('[EDGE-FUNCTION] DOO logo loaded successfully from CDN');
      }
    } catch (error) {
      console.error('[EDGE-FUNCTION] Error fetching DOO logo:', error);
    }

    // Fetch customer logo
    let customerLogoBytes: Uint8Array | null = null;
    if (customer.logo) {
      try {
        const { data: logoData } = await supabase.storage.from('customer-avatars').download(customer.logo);
        if (logoData) {
          customerLogoBytes = new Uint8Array(await logoData.arrayBuffer());
        }
      } catch (error) {
        console.error('[EDGE-FUNCTION] Error fetching customer logo:', error);
      }
    }

    const documents = [];

    for (const docType of document_types) {
      console.log(`[EDGE-FUNCTION] Generating ${docType}...`);

      let pdfBytes: Uint8Array;
      let fileName: string;

      switch (docType) {
        case 'proposal':
          pdfBytes = await generateProposal(customer, dooLogoBytes, customerLogoBytes);
          fileName = `${customer.name}_Proposal.pdf`;
          break;

        case 'service_agreement':
          pdfBytes = await generateServiceAgreement(customer, dooLogoBytes, customerLogoBytes);
          fileName = `${customer.name}_Service_Agreement.pdf`;
          break;

        case 'sla':
          pdfBytes = await generateSLA(customer, dooLogoBytes, customerLogoBytes);
          fileName = `${customer.name}_SLA.pdf`;
          break;

        case 'quotation':
          pdfBytes = await generateInvoice(customer, dooLogoBytes, customerLogoBytes);
          fileName = `${customer.name}_Quotation.pdf`;
          break;

        default:
          throw new Error(`Unknown document type: ${docType}`);
      }

      // Upload to storage
      const filePath = `${customer_id}/${docType}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error(`[EDGE-FUNCTION] Upload error for ${docType}:`, uploadError);
        throw uploadError;
      }

      // Save to database
      const { error: dbError } = await supabase.from('generated_documents').insert({
        customer_id,
        document_type: docType,
        file_path: filePath,
        format,
        metadata: options,
      });

      if (dbError) {
        console.error(`[EDGE-FUNCTION] Database error for ${docType}:`, dbError);
      }

      documents.push({
        type: docType,
        file_path: filePath,
        file_name: fileName,
      });

      console.log(`[EDGE-FUNCTION] Successfully generated ${docType}`);
    }

    return new Response(JSON.stringify({ success: true, documents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[EDGE-FUNCTION] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
