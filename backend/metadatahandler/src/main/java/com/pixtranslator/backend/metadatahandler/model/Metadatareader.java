package com.pixtranslator.backend.metadatahandler.model;

import com.adobe.internal.xmp.XMPException;
import com.adobe.internal.xmp.XMPMeta;
import com.adobe.internal.xmp.XMPMetaFactory;
import com.adobe.internal.xmp.properties.XMPProperty;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.imaging.ImageReadException;
import org.apache.commons.imaging.Imaging;
import org.apache.commons.imaging.common.ImageMetadata;
import org.apache.commons.imaging.formats.jpeg.JpegImageMetadata;
import org.apache.commons.imaging.formats.jpeg.JpegPhotoshopMetadata;
import org.apache.commons.imaging.formats.jpeg.iptc.IptcRecord;
import org.apache.commons.imaging.formats.jpeg.iptc.IptcTypes;
import org.apache.commons.imaging.formats.tiff.TiffField;
import org.apache.commons.imaging.formats.tiff.constants.TiffTagConstants;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Slf4j
public class Metadatareader {

    public static Set<String> getKeywords(final File picture) throws ImageReadException, IOException {
        Set<String> keywords = new HashSet<>();
        final ImageMetadata metadata = Imaging.getMetadata(picture);

        if (metadata instanceof JpegImageMetadata) {
            final JpegImageMetadata jpegMetadata = (JpegImageMetadata) metadata;

            //Exif

            //IPTC

            //XMP
            // XMPProperty dcSubject = picXmp.getProperty("http://purl.org/dc/elements/1.1/", "dc:subject");
        }

        return keywords;
    }

    public static String getCaption(final File picture) throws ImageReadException, IOException, XMPException {
        final ImageMetadata metadata = Imaging.getMetadata(picture);
        final String xmpXmlString = Imaging.getXmpXml(picture);
        String caption = "";

        //Exif & IPTC
        if (metadata instanceof JpegImageMetadata) {
            //Exif
            final JpegImageMetadata jpegMetadata = (JpegImageMetadata) metadata;
            final TiffField exifDescriptionField = jpegMetadata.findEXIFValueWithExactMatch(TiffTagConstants.TIFF_TAG_IMAGE_DESCRIPTION);
            if (exifDescriptionField != null) {
                log.info("Exif.Image.ImageDescription: " + exifDescriptionField.getValue().toString());
                caption = exifDescriptionField.getValue().toString();
            } else {
                log.warn("Exif.Image.ImageDescription is null!");
            }
            //IPTC
            IptcRecord iptcCaption = new IptcRecord(IptcTypes.CAPTION_ABSTRACT, "");
            final JpegPhotoshopMetadata photoshopMetadata = jpegMetadata.getPhotoshop();
            final List<IptcRecord> iptcData = photoshopMetadata.photoshopApp13Data.getRecords();
            //Collections.sort(iptcData, IptcRecord.COMPARATOR);
            for (final IptcRecord iptcPiece : iptcData) {
                if (iptcPiece.iptcType.equals(IptcTypes.CAPTION_ABSTRACT)) {
                    iptcCaption = iptcPiece;
                    log.info("Iptc.Caption: " + iptcCaption.getValue());
                    break;
                }
            }

            if (caption.isEmpty() || ! exifDescriptionField.getValue().toString().equals(iptcCaption.getValue())) {
                log.warn("IPTC Caption and Exif Description not alike - IPTC: " +
                        (iptcCaption != null ? iptcCaption.getValue() : "null") +
                        " - Exif Description: " +
                        (caption.isEmpty() ? "<empty>" : caption));
                if (caption.isEmpty() && iptcCaption != null) {
                    caption = iptcCaption.getValue();
                }
            }
        }
        //XMP
        if (xmpXmlString != null) {
            XMPMeta picXmp = XMPMetaFactory.parseFromString(xmpXmlString);
            XMPProperty dcDescription = picXmp.getLocalizedText("http://purl.org/dc/elements/1.1/", "dc:description", "", "x-default");
            if (dcDescription != null) {
                log.info("xmp.dc.description: " + dcDescription.getValue());
            } else {
                log.warn("xmp.dc:description is null!");
            }
            XMPProperty photoshopHeadline = picXmp.getProperty("http://ns.adobe.com/photoshop/1.0/", "photoshop:Headline");
            if (photoshopHeadline != null) {
                log.info("xmp.photoshop:Headline" + photoshopHeadline.getValue());
            }
            if (dcDescription != null && !dcDescription.getValue().equals(caption)) {
                log.warn("XMP Caption and Exif Description not alike - XMP: " +
                        (dcDescription != null ? dcDescription.getValue() : "null") +
                        " - Exif Description: " +
                        (caption.isEmpty() ? "<empty>" : caption));
                if (caption.isEmpty()) {
                    caption = dcDescription.getValue();
                }
            }
        }
        return caption;
    }

    public static Map<String, Object[]> getKeywordsAndCaptions(final File picture) throws ImageReadException, IOException, XMPException {
        Map<String, Object[]> response = new HashMap<>();
        response.put("Keywords", getKeywords(picture).toArray());
        response.put("Caption", new String[]{getCaption(picture)});
        return response;
    }
}
