import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../components/common/Button';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type ParamList = {
    ClinicalReport: { reportData: any; patientName: string };
};

export const ClinicalReportScreen = () => {
    const route = useRoute<RouteProp<ParamList, 'ClinicalReport'>>();
    const navigation = useNavigation();
    const { reportData, patientName } = route.params;

    // ----- HTML Generator para el PDF -----
    const generateHtmlForPdf = () => {
        let itemsHtml = '';
        if (reportData.focos_principales && Array.isArray(reportData.focos_principales)) {
            itemsHtml += '<h3>Focos Principales (Entidades Identificadas)</h3><ul>';
            reportData.focos_principales.forEach((foco: any) => {
                itemsHtml += `<li><strong>${foco.entidad}</strong>: ${foco.detalle}</li>`;
            });
            itemsHtml += '</ul>';
        }

        let observationsHtml = '';
        if (reportData.observaciones_clinicas && Array.isArray(reportData.observaciones_clinicas)) {
            observationsHtml += '<h3>Observaciones Clínicas (Patrones Relacionales)</h3><ul>';
            reportData.observaciones_clinicas.forEach((obs: string) => {
                observationsHtml += `<li>${obs}</li>`;
            });
            observationsHtml += '</ul>';
        }

        return `
        <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    h1 { color: #1E3A8A; text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 15px; margin-bottom: 30px; }
                    h2 { color: #2563EB; font-size: 18px; margin-top: 25px; border-left: 4px solid #3B82F6; padding-left: 10px; }
                    h3 { color: #4B5563; font-size: 16px; margin-top: 20px; }
                    p { margin-bottom: 15px; text-align: justify; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 8px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px;}
                </style>
            </head>
            <body>
                <h1>Informe Clínico - Evolución de Sesión</h1>
                <p><strong>Paciente:</strong> ${patientName || 'Paciente'}</p>
                <p><strong>Fecha del Informe:</strong> ${new Date().toLocaleDateString()}</p>
                
                <h2>Resumen Narrativo</h2>
                <p>${reportData.resumen_narrativo || 'Sin resumen disponible.'}</p>
                
                <h2>Análisis Estructurado</h2>
                ${itemsHtml}
                ${observationsHtml}
                
                <h2>Evaluación de Riesgo</h2>
                <p><strong>Nivel:</strong> <span style="color: ${reportData.evaluacion_riesgo?.nivel_riesgo === 'ALTO' ? 'red' : 'inherit'}">${reportData.evaluacion_riesgo?.nivel_riesgo || 'No especificado'}</span></p>
                <p><strong>Justificación:</strong> ${reportData.evaluacion_riesgo?.justificacion || 'Sin justificación.'}</p>
                
                <h2>Plan de Acción Sugerido</h2>
                <p>${reportData.plan_accion_sugerido || 'No hay plan de acción sugerido.'}</p>
                
                <div class="footer">
                    Generado automáticamente por Co-Therapyst AI. Este documento es un asistente clínico y no reemplaza el juicio del profesional.
                </div>
            </body>
        </html>
        `;
    };

    // ----- Exportadores -----
    const handleDownloadPDF = async () => {
        try {
            const html = generateHtmlForPdf();
            const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 }); // US Letter size
            console.log('File has been saved to:', uri);
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error("Failed to generate PDF", error);
            Alert.alert('Error', 'No se pudo generar el documento PDF.');
        }
    };

    const handleCopyToClipboard = async () => {
        // Generamos un formato tipo texto plano
        let textContent = `INFORME CLÍNICO - ${patientName?.toUpperCase() || 'PACIENTE'}\n`;
        textContent += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
        textContent += `--- RESUMEN NARRATIVO ---\n${reportData.resumen_narrativo || ''}\n\n`;

        if (reportData.focos_principales?.length > 0) {
            textContent += `--- FOCOS PRINCIPALES ---\n`;
            reportData.focos_principales.forEach((i: any) => textContent += `- ${i.entidad}: ${i.detalle}\n`);
            textContent += '\n';
        }

        if (reportData.observaciones_clinicas?.length > 0) {
            textContent += `--- OBSERVACIONES CLÍNICAS ---\n`;
            reportData.observaciones_clinicas.forEach((i: string) => textContent += `- ${i}\n`);
            textContent += '\n';
        }

        if (reportData.evaluacion_riesgo) {
            textContent += `--- EVALUACIÓN DE RIESGO ---\n`;
            textContent += `Nivel: ${reportData.evaluacion_riesgo.nivel_riesgo || 'N/A'}\n`;
            textContent += `Justificación: ${reportData.evaluacion_riesgo.justificacion || 'N/A'}\n\n`;
        }

        textContent += `--- PLAN DE ACCIÓN SUGERIDO ---\n${reportData.plan_accion_sugerido || ''}`;

        await Clipboard.setStringAsync(textContent);
        Alert.alert('¡Copiado!', 'El contenido del informe se ha copiado al portapapeles.');
    };

    // ----- UI Render Helpers -----
    const renderFocos = () => {
        if (!reportData.focos_principales || !Array.isArray(reportData.focos_principales) || reportData.focos_principales.length === 0) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Focos Principales</Text>
                {reportData.focos_principales.map((item: any, index: number) => (
                    <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>
                            <Text style={styles.boldText}>{item.entidad}: </Text>
                            {item.detalle}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderObservaciones = () => {
        if (!reportData.observaciones_clinicas || !Array.isArray(reportData.observaciones_clinicas) || reportData.observaciones_clinicas.length === 0) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Patrones Relacionales</Text>
                {reportData.observaciones_clinicas.map((item: string, index: number) => (
                    <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{item}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Informe Clínico</Text>
                <View style={{ width: 28 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Nota de paciente */}
                <View style={styles.patientBanner}>
                    <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                    <Text style={styles.patientBannerText}>Evolución para {patientName}</Text>
                </View>

                {/* Resumen */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen Narrativo</Text>
                    <Text style={styles.paragraph}>{reportData.resumen_narrativo || "Información no disponible."}</Text>
                </View>

                {/* Arrays Estructurados */}
                {renderFocos()}
                {renderObservaciones()}

                {/* Riesgo */}
                {reportData.evaluacion_riesgo && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Evaluación de Riesgo</Text>
                        <View style={styles.riskBadge}>
                            <Text style={styles.riskBadgeText}>Nivel: <Text style={{ fontWeight: 'bold' }}>{reportData.evaluacion_riesgo.nivel_riesgo || 'No especificado'}</Text></Text>
                        </View>
                        <Text style={styles.paragraph}>{reportData.evaluacion_riesgo.justificacion}</Text>
                    </View>
                )}

                {/* Plan Accion */}
                <View style={[styles.section, { borderBottomWidth: 0 }]}>
                    <Text style={styles.sectionTitle}>Plan de Acción / Prox. Sesión</Text>
                    <Text style={styles.paragraph}>{reportData.plan_accion_sugerido || "Información no disponible."}</Text>
                </View>

                <View style={styles.footerSpacer} />
            </ScrollView>

            {/* Bottom Actions Floating Bar */}
            <View style={styles.actionContainer}>
                <Button
                    title="Copiar Texto"
                    onPress={handleCopyToClipboard}
                    variant="outline"
                    style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                    title="Descargar PDF"
                    onPress={handleDownloadPDF}
                    variant="primary"
                    style={{ flex: 1, marginLeft: 8 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe Area offset
        paddingBottom: 10,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    content: { padding: 20 },
    patientBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
    },
    patientBannerText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: Colors.primary },
    section: {
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start'
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 8,
        marginRight: 10,
    },
    listText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        lineHeight: 22,
    },
    boldText: { fontWeight: '700' },
    riskBadge: {
        backgroundColor: Colors.background,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border
    },
    riskBadgeText: { fontSize: 14, color: Colors.textLight },
    footerSpacer: { height: 60 }, // Espacio para que no lo tape el ActionContainer
    actionContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 30 // Safe Area offset
    }
});
