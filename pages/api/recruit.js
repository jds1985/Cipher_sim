import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {

    if (req.method !== 'POST') {

        return res.status(405).json({
            success: false
        });

    }

    try {

        const {
            name,
            email,
            location,
            background,
            message
        } = req.body;

        // EMAIL TO YOU
        await resend.emails.send({

            from: 'Cipher CTS <onboarding@resend.dev>',

            to: 'jimsaenz72@gmail.com',

            subject: `New Cipher CTS Applicant - ${name}`,

            html: `

                <div style="
                    font-family: Arial;
                    background:#0a0a12;
                    color:white;
                    padding:30px;
                ">

                    <h1 style="color:#00ffd5;">
                        New Deployment Network Application
                    </h1>

                    <hr style="
                        border:none;
                        border-top:1px solid #222;
                        margin:20px 0;
                    ">

                    <p><strong>Name:</strong> ${name}</p>

                    <p><strong>Email:</strong> ${email}</p>

                    <p><strong>Location:</strong> ${location}</p>

                    <p><strong>Background:</strong> ${background}</p>

                    <p><strong>Why They Fit Cipher CTS:</strong></p>

                    <div style="
                        background:#111827;
                        padding:20px;
                        border-radius:12px;
                        line-height:1.8;
                    ">
                        ${message}
                    </div>

                </div>

            `

        });

        // CONFIRMATION EMAIL TO APPLICANT
        await resend.emails.send({

            from: 'Cipher CTS <onboarding@resend.dev>',

            to: email,

            subject: 'Cipher CTS Deployment Network',

            html: `

                <div style="
                    background:#05060a;
                    color:white;
                    padding:40px;
                    font-family:Arial;
                ">

                    <h1 style="
                        color:#00ffd5;
                        margin-bottom:20px;
                    ">
                        APPLICATION RECEIVED
                    </h1>

                    <p style="
                        line-height:1.8;
                        color:rgba(255,255,255,0.82);
                    ">
                        Your Cipher CTS Deployment Network
                        application has been successfully transmitted.
                    </p>

                    <p style="
                        line-height:1.8;
                        color:rgba(255,255,255,0.82);
                    ">
                        We are currently reviewing regional operators
                        for Knoxville and surrounding deployment zones.
                    </p>

                    <div style="
                        margin-top:30px;
                        padding:20px;
                        border:1px solid rgba(0,255,213,0.15);
                        border-radius:16px;
                        background:#0b1018;
                    ">

                        <strong style="color:#00ffd5;">
                            STATUS:
                        </strong>

                        <p style="
                            margin-top:10px;
                            color:rgba(255,255,255,0.75);
                            line-height:1.7;
                        ">
                            NODE CANDIDATE REGISTERED
                        </p>

                    </div>

                </div>

            `

        });

        return res.status(200).json({
            success: true
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });

    }

}
