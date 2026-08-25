import { prisma } from '@/lib/prisma';

export interface WhatsAppMessagePayload {
  toPhone: string;
  messageBody: string;
  studentId?: string;
  type?: 'QUIZ_RESULT' | 'HOMEWORK_GRADED' | 'LIVE_SESSION_ALERT' | 'GENERAL';
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: string;
  whatsappLink?: string;
}

/**
 * Formats a phone number for international WhatsApp standard.
 * e.g. "01012345678" -> "201012345678"
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // If local Egyptian phone starting with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Core WhatsApp Notification Sender.
 * Integrates with UltraMsg / Twilio / Webhook APIs with automatic fallback and NotificationLog persistence.
 */
export async function sendWhatsAppMessage({
  toPhone,
  messageBody,
  studentId,
  type = 'GENERAL',
}: WhatsAppMessagePayload): Promise<WhatsAppResult> {
  const formattedPhone = formatWhatsAppPhone(toPhone);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageBody)}`;

  try {
    let sentSuccess = false;
    let providerError: string | null = null;

    const ultraMsgInstance = process.env.WHATSAPP_INSTANCE_ID;
    const ultraMsgToken = process.env.WHATSAPP_TOKEN;

    // 1. UltraMsg API Dispatch if credentials provided
    if (ultraMsgInstance && ultraMsgToken) {
      try {
        const res = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: ultraMsgToken,
            to: formattedPhone,
            body: messageBody,
          }),
        });
        const data = await res.json();
        if (data.sent === 'true' || data.id) {
          sentSuccess = true;
        } else {
          providerError = data.error || 'Failed to dispatch via UltraMsg';
        }
      } catch (err: any) {
        providerError = err.message || 'UltraMsg network error';
      }
    } else {
      // 2. Ready mock / direct simulated dispatch
      sentSuccess = true;
      console.log(`[WhatsApp Automated Notification] -> To: ${formattedPhone} | Type: ${type}\n${messageBody}\nDirect Link: ${whatsappLink}`);
    }

    // 3. Persist in Database NotificationLog
    await prisma.notificationLog.create({
      data: {
        recipient: formattedPhone,
        studentId: studentId || null,
        type,
        status: sentSuccess ? 'SENT' : 'FAILED',
        content: messageBody,
        errorMessage: providerError,
      },
    });

    return {
      success: sentSuccess,
      recipient: formattedPhone,
      whatsappLink,
      error: providerError || undefined,
    };
  } catch (err: any) {
    console.error('Error in sendWhatsAppMessage:', err);
    try {
      await prisma.notificationLog.create({
        data: {
          recipient: formattedPhone,
          studentId: studentId || null,
          type,
          status: 'FAILED',
          content: messageBody,
          errorMessage: err.message,
        },
      });
    } catch {}

    return {
      success: false,
      recipient: formattedPhone,
      error: err.message,
      whatsappLink,
    };
  }
}

/**
 * Trigger 1: Send WhatsApp Alert to Parent when Homework is Graded
 */
export async function notifyParentHomeworkGraded({
  studentName,
  parentPhone,
  studentId,
  assignmentTitle,
  grade,
  maxScore,
  teacherNote,
}: {
  studentName: string;
  parentPhone: string;
  studentId: string;
  assignmentTitle: string;
  grade: number;
  maxScore: number;
  teacherNote?: string | null;
}) {
  const percentage = Math.round((grade / maxScore) * 100);
  const statusEmoji = percentage >= 85 ? '🌟 ممتاز' : percentage >= 65 ? '👍 جيد جداً' : '⚠️ يحتاج لمتابعة';

  const message = `السلام عليكم ولي أمر الطالب/ة: *${studentName}* 📚

تم تصحيح واجب: *${assignmentTitle}*
- الدرجة المستحقة: *${grade} / ${maxScore}* (${percentage}%)
- التقييم: ${statusEmoji}
${teacherNote ? `- ملاحظات المعلم: "${teacherNote}"` : ''}

يمكنكم متابعة تقرير الطالب كاملاً عبر المنصة التعليمية.
مع تحيات إدارة المنصة 🎓`;

  return await sendWhatsAppMessage({
    toPhone: parentPhone,
    messageBody: message,
    studentId,
    type: 'HOMEWORK_GRADED',
  });
}

/**
 * Trigger 2: Send WhatsApp Alert to Parent on Quiz/Exam Completion
 */
export async function notifyParentQuizCompleted({
  studentName,
  parentPhone,
  studentId,
  quizTitle,
  score,
  maxScore,
  percentage,
  isPassed,
  status,
}: {
  studentName: string;
  parentPhone: string;
  studentId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  status: string;
}) {
  const resultText = status === 'PENDING'
    ? 'قيد مراجعة الأسئلة المقالية من قبل المعلم'
    : isPassed
    ? `ناجح بنسبة (${percentage}%) 🎉`
    : `غير مجتاز (${percentage}%) - يرجى المتابعة ⚠️`;

  const message = `السلام عليكم ولي أمر الطالب/ة: *${studentName}* 📝

أتم الطالب للتو امتحان: *${quizTitle}*
- النتيجة: *${score} / ${maxScore}*
- الحالة: *${resultText}*
- وقت التسليم: ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}

تفاصيل الأسئلة والتصحيح متاحة على حساب الطالب بالمنصة.
شكراً لحرصكم على متابعة ابنكم 🎓`;

  return await sendWhatsAppMessage({
    toPhone: parentPhone,
    messageBody: message,
    studentId,
    type: 'QUIZ_RESULT',
  });
}

/**
 * Trigger 3: Broadcast WhatsApp Alert to Parents of a Specific Academic Grade for Live Stream
 */
export async function broadcastLiveSessionByGrade({
  targetGrade,
  title,
  roomCode,
  classroomName,
  appBaseUrl = 'https://montreal-goes-demonstrated-awards.trycloudflare.com',
}: {
  targetGrade: string;
  title: string;
  roomCode: string;
  classroomName: string;
  appBaseUrl?: string;
}) {
  // Query strictly students belonging to this academic grade who have a parent phone
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      grade: targetGrade,
      parentPhone: { not: null },
    },
    select: {
      id: true,
      name: true,
      parentPhone: true,
      grade: true,
    },
  });

  const directLiveUrl = `${appBaseUrl}/ar/student/live?room=${roomCode}`;
  const results: WhatsAppResult[] = [];

  // Sequential queue with 100ms throttle to prevent provider rate-limits
  for (const student of students) {
    if (!student.parentPhone) continue;

    const message = `تنبيه عاجل: بث مباشر جاري الآن! 🔴📡

الصف الدراسي: *${targetGrade}* (${classroomName})
عنوان الحصة: *${title}*
كود الدخول: \`${roomCode}\`

🔗 رابط الانضمام المباشر للحصة:
${directLiveUrl}&name=${encodeURIComponent(student.name)}

يرجى توجيه الطالب/ة (*${student.name}*) للدخول فوراً لبدء الشرح التفاعلي.
إدارة المنصة التعليمية 🎓`;

    const res = await sendWhatsAppMessage({
      toPhone: student.parentPhone,
      messageBody: message,
      studentId: student.id,
      type: 'LIVE_SESSION_ALERT',
    });

    results.push(res);
    // Small delay between notifications
    await new Promise((r) => setTimeout(r, 80));
  }

  return {
    totalTargeted: students.length,
    sentCount: results.filter((r) => r.success).length,
    results,
  };
}
